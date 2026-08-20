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
    const lastProd = await prisma.production.findFirst({
      orderBy: { productionNumber: 'desc' },
      select: { productionNumber: true },
    });
    let nextProdNum = 1;
    if (lastProd?.productionNumber) {
      const match = lastProd.productionNumber.match(/(\d+)$/);
      if (match) nextProdNum = parseInt(match[1], 10) + 1;
    }
    const productionNumber = `PROD-2026-${String(nextProdNum).padStart(4, '0')}`;

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

    let primaryBatchId = '';
    const batchUpdates: { batchId: string; deductedWax: number; addedProduced: number }[] = [];

    // Always use FIFO logic. If user selected a specific batch, start from that batch first.
    // If the selected batch doesn't have enough wax, spill over to the next oldest batches.

    let remainingWaxToDeduct = waxNum;

    if (batchId && batchId !== 'FIFO') {
      // 1. User selected a SPECIFIC Batch -> Try to deduct from this batch first
      const specificBatch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      if (specificBatch) {
        primaryBatchId = specificBatch.id;
        const availableInBatch = Math.max(0, specificBatch.waxStock);
        const deduct = Math.min(remainingWaxToDeduct, availableInBatch);

        if (deduct > 0) {
          const producedShare = waxNum > 0 ? (deduct / waxNum) * outputQty : deduct;
          batchUpdates.push({
            batchId: specificBatch.id,
            deductedWax: deduct,
            addedProduced: producedShare,
          });
          remainingWaxToDeduct -= deduct;
        }
      }
    }

    // 2. If there's still wax to deduct (either FIFO mode or spillover from specific batch),
    //    deduct from oldest available batches with waxStock > 0
    if (remainingWaxToDeduct > 0) {
      const availableBatches = await prisma.batch.findMany({
        where: {
          waxStock: { gt: 0 },
          // Exclude the batch we already deducted from
          ...(primaryBatchId ? { id: { not: primaryBatchId } } : {}),
        },
        orderBy: [
          { batchNumber: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      for (const batch of availableBatches) {
        if (remainingWaxToDeduct <= 0) break;

        const deduct = Math.min(remainingWaxToDeduct, batch.waxStock);
        const producedShare = waxNum > 0 ? (deduct / waxNum) * outputQty : deduct;

        batchUpdates.push({
          batchId: batch.id,
          deductedWax: deduct,
          addedProduced: producedShare,
        });

        if (!primaryBatchId) {
          primaryBatchId = batch.id;
        }

        remainingWaxToDeduct -= deduct;
      }

      // If wax required exceeds ALL available wax stock, deduct overflow from newest batch
      if (remainingWaxToDeduct > 0) {
        const latestBatch = await prisma.batch.findFirst({
          orderBy: { createdAt: 'desc' },
        });

        if (latestBatch) {
          if (!primaryBatchId) primaryBatchId = latestBatch.id;

          const existingUpdate = batchUpdates.find(u => u.batchId === latestBatch.id);
          const producedShare = waxNum > 0 ? (remainingWaxToDeduct / waxNum) * outputQty : remainingWaxToDeduct;

          if (existingUpdate) {
            existingUpdate.deductedWax += remainingWaxToDeduct;
            existingUpdate.addedProduced += producedShare;
          } else {
            batchUpdates.push({
              batchId: latestBatch.id,
              deductedWax: remainingWaxToDeduct,
              addedProduced: producedShare,
            });
          }
        }
      }
    }

    // If still no batch exists, create a default batch
    if (!primaryBatchId) {
      const batchCount = await prisma.batch.count();
      const newBatch = await prisma.batch.create({
        data: {
          batchNumber: `BATCH-${String(batchCount).padStart(3, '0')}`,
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

    // Apply batch updates: Deduct Wax Stock AND Increase Produced/Remaining Qty on the affected batches
    for (const u of batchUpdates) {
      await prisma.batch.update({
        where: { id: u.batchId },
        data: {
          waxStock: { decrement: u.deductedWax },
          producedQty: { increment: u.addedProduced },
          remainingQty: { increment: u.addedProduced },
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
            notes: `Wax consumed for production run ${productionNumber}`,
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
        notes: notes || (batchUpdates.length > 1
          ? `Wax deducted & candles added across ${batchUpdates.length} FIFO batches`
          : undefined),
      },
      include: { batch: true, operator: true },
    });

    return jsonResponse(production, 201, 'Production run logged successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to log production', 400);
  }
}
