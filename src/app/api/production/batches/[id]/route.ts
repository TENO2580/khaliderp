import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();

    if (
      (body.waxInitialQty !== undefined && body.waxInitialQty < 0) ||
      (body.waxRate !== undefined && body.waxRate < 0) ||
      (body.waxStock !== undefined && body.waxStock < 0) ||
      (body.sellingPrice !== undefined && body.sellingPrice < 0) ||
      (body.producedQty !== undefined && body.producedQty < 0) ||
      (body.soldQty !== undefined && body.soldQty < 0) ||
      (body.remainingQty !== undefined && body.remainingQty < 0)
    ) {
      return errorResponse('Negative values are not allowed', 400);
    }

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

    // Check if this is the latest batch, and if so, update the CostingProfile
    if (body.waxRate !== undefined && body.waxRate !== null) {
      try {
        const latestBatch = await prisma.batch.findFirst({
          orderBy: { createdAt: 'desc' }
        });
        if (latestBatch && latestBatch.id === id) {
          const defaultProfile = await prisma.costingProfile.findFirst({
            orderBy: { updatedAt: 'desc' }
          });
          if (defaultProfile) {
            await prisma.costingProfile.update({
              where: { id: defaultProfile.id },
              data: { waxCost: Number(body.waxRate) }
            });
          }
        }
      } catch (profileErr) {
        console.error("Failed to sync waxRate to CostingProfile on edit", profileErr);
      }
    }

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

    // 1. Unlink any sales order items referencing this batch
    await prisma.salesOrderItem.updateMany({
      where: { batchId: id },
      data: { batchId: null },
    });

    // 2. Delete linked production runs
    await prisma.production.deleteMany({
      where: { batchId: id },
    });

    // 3. Delete the batch
    await prisma.batch.delete({
      where: { id },
    });

    return jsonResponse({ success: true, message: 'Batch and linked records deleted successfully' });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete batch', 500);
  }
}
