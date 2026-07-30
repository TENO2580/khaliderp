import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const batches = await prisma.batch.findMany({
    orderBy: { productionDate: 'desc' },
    include: { product: true, productions: true },
  });

  return jsonResponse({ data: batches });
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { productId, producedQty, sellingPrice, notes } = body;

    const count = await prisma.batch.count();
    const batchNumber = `BATCH-2026-${String(count + 1).padStart(4, '0')}`;

    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        productId,
        producedQty: Number(producedQty || 0),
        sellingPrice: Number(sellingPrice || 0),
        status: 'IN_PRODUCTION',
        productionDate: new Date(),
      },
      include: { product: true },
    });

    return jsonResponse(batch, 201, 'Batch created successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create batch', 400);
  }
}
