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

    const {
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

    const waxCost = waxUsed * 85;
    const fragranceCost = fragranceUsed * 400;
    const colorCost = colorUsed * 250;
    const containerCost = containerUsed * 25;
    const wickCost = wickUsed * 2;

    const totalRawMaterialCost = waxCost + fragranceCost + colorCost + containerCost + wickCost;
    const totalOverheadCost = Number(labourCost) + Number(gasCost) + Number(electricityCost) + Number(otherCosts);
    const totalCost = totalRawMaterialCost + totalOverheadCost;

    const costPerKg = waxUsed > 0 ? totalCost / waxUsed : 0;
    const totalRevenue = quantityProduced * sellingPrice;
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    const production = await prisma.production.create({
      data: {
        productionNumber,
        date: new Date(date || Date.now()),
        batchId,
        operatorId: user.id,
        shift: shift === 'NIGHT' ? 'NIGHT' : 'DAY',
        waxUsed: Number(waxUsed),
        fragranceUsed: Number(fragranceUsed),
        colorUsed: Number(colorUsed),
        containerUsed: Number(containerUsed),
        wickUsed: Number(wickUsed),
        labourCost: Number(labourCost),
        gasCost: Number(gasCost),
        electricityCost: Number(electricityCost),
        otherCosts: Number(otherCosts),
        totalCost,
        quantityProduced: Number(quantityProduced),
        costPerKg,
        sellingPrice: Number(sellingPrice),
        profit,
        margin,
        notes,
      },
      include: { batch: true, operator: true },
    });

    return jsonResponse(production, 201, 'Production run logged');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to log production', 400);
  }
}
