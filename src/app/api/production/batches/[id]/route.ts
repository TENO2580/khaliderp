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
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        waxInitialQty: body.waxInitialQty,
        waxRate: body.waxRate,
        waxStock: body.waxStock,
        productionCost: (body.waxInitialQty !== undefined && body.waxRate !== undefined) ? (body.waxInitialQty * body.waxRate) : undefined,
        sellingPrice: body.sellingPrice,
        producedQty: body.producedQty,
        soldQty: body.soldQty,
        remainingQty: body.remainingQty,
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
