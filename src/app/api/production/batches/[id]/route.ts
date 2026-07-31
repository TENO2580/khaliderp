import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const batch = await prisma.batch.update({
      where: { id },
      data: {
        productId: body.productId || undefined,
        productionDate: body.productionDate ? new Date(body.productionDate) : undefined,
        waxUsed: body.waxUsed,
        productionCost: body.productionCost,
        sellingPrice: body.sellingPrice,
        producedQty: body.producedQty,
        soldQty: body.soldQty,
        remainingQty: body.remainingQty,
        profit: body.profit,
        costPerKg: body.costPerKg,
        status: body.status,
      },
    });
    return jsonResponse(batch);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update batch', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.batch.delete({
      where: { id },
    });
    return jsonResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete batch', 500);
  }
}
