import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const search = url.searchParams.get('search') || '';

  const skip = (page - 1) * limit;
  const where: any = {};

  if (search) {
    where.OR = [
      { productionNumber: { contains: search, mode: 'insensitive' } },
      { batch: { batchNumber: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.production.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        productionNumber: true,
        date: true,
        batchId: true,
        operatorId: true,
        shift: true,
        waxUsed: true,
        totalCost: true,
        quantityProduced: true,
        costPerKg: true,
        sellingPrice: true,
        profit: true,
        margin: true,
        notes: true,
        batch: {
          select: {
            batchNumber: true,
            product: { select: { name: true } }
          }
        },
        operator: {
          select: { name: true }
        }
      },
    }),
    prisma.production.count({ where }),
  ]);

  return jsonResponse({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const count = await prisma.production.count();
    const productionNumber = `PROD-2026-${String(count + 1).padStart(4, '0')}`;

    let {
      date,
      batchId,
      shift = 'DAY',
      waxUsed = 0,
      fragranceUsed = 0,
      colorUsed = 0,
      containerUsed = 0,
      wickUsed = 0,
      labourCost = 0,
      gasCost = 0,
      electricityCost = 0,
      otherCosts = 0,
      quantityProduced = 0,
      sellingPrice = 0,
      notes,
    } = body;

    const waxNum = Number(waxUsed) || 0;
    const outputQty = Number(quantityProduced) || 0;

    // FIFO Deduct Wax Stock from Batches
    let primaryBatchId = batchId && batchId !== 'FIFO' ? batchId : null;

    // Fetch all available batches ordered by FIFO (purchaseDate ASC, createdAt ASC)
    const availableBatches = await prisma.batch.findMany({
      where: {
        waxStock: { gt: 0 },
      },
      orderBy: [
        { purchaseDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    let remainingWaxToDeduct = waxNum;
    const batchDeductions: { batchId: string; deductedWax: number; addedProduced: number }[] = [];

    if (availableBatches.length > 0) {
      if (!primaryBatchId) {
        primaryBatchId = availableBatches[0].id;
      }

      // If user selected a specific batch, deduct from it first
      const selectedBatch = primaryBatchId ? availableBatches.find(b => b.id === primaryBatchId) : null;
      if (selectedBatch && selectedBatch.waxStock > 0) {
        const deduct = Math.min(remainingWaxToDeduct, selectedBatch.waxStock);
        const producedShare = waxNum > 0 ? (deduct / waxNum) * outputQty : deduct;
        batchDeductions.push({ batchId: selectedBatch.id, deductedWax: deduct, addedProduced: producedShare });
        remainingWaxToDeduct -= deduct;
      }

      // Deduct remainder using FIFO across other batches
      if (remainingWaxToDeduct > 0) {
        for (const batch of availableBatches) {
          if (selectedBatch && batch.id === selectedBatch.id) continue;
          if (remainingWaxToDeduct <= 0) break;

          const deduct = Math.min(remainingWaxToDeduct, batch.waxStock);
          const producedShare = waxNum > 0 ? (deduct / waxNum) * outputQty : deduct;
          batchDeductions.push({ batchId: batch.id, deductedWax: deduct, addedProduced: producedShare });
          remainingWaxToDeduct -= deduct;
        }
      }
    }

    // If still remaining (or no batches had waxStock > 0), deduct from primaryBatchId or latest batch
    if (remainingWaxToDeduct > 0) {
      if (!primaryBatchId) {
        const latestBatch = await prisma.batch.findFirst({ orderBy: { createdAt: 'desc' } });
        primaryBatchId = latestBatch ? latestBatch.id : '';
      }
      if (primaryBatchId) {
        const existingDeduction = batchDeductions.find(d => d.batchId === primaryBatchId);
        if (existingDeduction) {
          existingDeduction.deductedWax += remainingWaxToDeduct;
          existingDeduction.addedProduced += (waxNum > 0 ? (remainingWaxToDeduct / waxNum) * outputQty : remainingWaxToDeduct);
        } else {
          batchDeductions.push({
            batchId: primaryBatchId,
            deductedWax: remainingWaxToDeduct,
            addedProduced: (waxNum > 0 ? (remainingWaxToDeduct / waxNum) * outputQty : remainingWaxToDeduct),
          });
        }
        remainingWaxToDeduct = 0;
      }
    }

    if (!primaryBatchId) {
      const newBatch = await prisma.batch.create({
        data: {
          batchNumber: `BATCH-${String(count + 1).padStart(3, '0')}`,
          purchaseDate: new Date(),
          waxInitialQty: waxNum,
          waxStock: 0,
          producedQty: outputQty,
          remainingQty: outputQty,
          status: 'IN_PRODUCTION',
        },
      });
      primaryBatchId = newBatch.id;
    }

    // Apply batch updates in DB
    for (const d of batchDeductions) {
      await prisma.batch.update({
        where: { id: d.batchId },
        data: {
          waxStock: { decrement: d.deductedWax },
          producedQty: { increment: d.addedProduced },
          remainingQty: { increment: d.addedProduced },
        },
      });
    }

    // Deduct from RawMaterial (Wax)
    try {
      const waxMaterial = await prisma.rawMaterial.findFirst({
        where: {
          OR: [
            { category: 'WAX' },
            { name: { contains: 'Wax', mode: 'insensitive' } },
          ],
        },
      });

      if (waxMaterial) {
        await prisma.rawMaterial.update({
          where: { id: waxMaterial.id },
          data: {
            currentStock: Math.max(0, waxMaterial.currentStock - waxNum),
          },
        });

        await prisma.stockMovement.create({
          data: {
            rawMaterialId: waxMaterial.id,
            type: 'PRODUCTION_OUT',
            quantity: waxNum,
            reference: productionNumber,
            notes: `Wax consumed for production run ${productionNumber} (FIFO)`,
          },
        });
      }
    } catch (rawErr) {
      console.error('Error updating raw material stock:', rawErr);
    }

    // Update finished goods inventory if primaryBatch has a productId
    const primaryBatch = await prisma.batch.findUnique({
      where: { id: primaryBatchId },
      include: { product: true },
    });

    if (primaryBatch?.productId) {
      try {
        const inventory = await prisma.inventory.findUnique({
          where: { productId: primaryBatch.productId },
        });
        if (inventory) {
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              currentStock: { increment: outputQty },
              lastUpdated: new Date(),
            },
          });
          await prisma.stockMovement.create({
            data: {
              inventoryId: inventory.id,
              type: 'PRODUCTION_IN',
              quantity: outputQty,
              reference: productionNumber,
              notes: `Finished candles added from production ${productionNumber}`,
            },
          });
        }
      } catch (invErr) {
        console.error('Error updating product inventory:', invErr);
      }
    }

    const waxCost = waxNum * (primaryBatch?.waxRate || 85);
    const fragranceCost = Number(fragranceUsed) * 400;
    const colorCost = Number(colorUsed) * 250;
    const containerCost = Number(containerUsed) * 25;
    const wickCost = Number(wickUsed) * 2;

    const totalRawMaterialCost = waxCost + fragranceCost + colorCost + containerCost + wickCost;
    const totalOverheadCost = Number(labourCost) + Number(gasCost) + Number(electricityCost) + Number(otherCosts);
    const totalCost = totalRawMaterialCost + totalOverheadCost;

    const costPerKg = waxNum > 0 ? totalCost / waxNum : 0;
    const totalRevenue = outputQty * Number(sellingPrice);
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    const production = await prisma.production.create({
      data: {
        productionNumber,
        date: new Date(date || Date.now()),
        batchId: primaryBatchId,
        operatorId: user.id,
        shift: shift === 'NIGHT' ? 'NIGHT' : 'DAY',
        waxUsed: waxNum,
        fragranceUsed: Number(fragranceUsed),
        colorUsed: Number(colorUsed),
        containerUsed: Number(containerUsed),
        wickUsed: Number(wickUsed),
        labourCost: Number(labourCost),
        gasCost: Number(gasCost),
        electricityCost: Number(electricityCost),
        otherCosts: Number(otherCosts),
        totalCost,
        quantityProduced: outputQty,
        costPerKg,
        sellingPrice: Number(sellingPrice),
        profit,
        margin,
        notes: notes || (batchDeductions.length > 1
          ? `FIFO deducted across ${batchDeductions.length} batches`
          : undefined),
      },
      include: { batch: true, operator: true },
    });

    return jsonResponse(production, 201, 'Production run logged & Wax Stock deducted via FIFO');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to log production', 400);
  }
}
