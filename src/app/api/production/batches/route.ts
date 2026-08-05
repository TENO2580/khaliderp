import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { NotificationService } from '@/lib/services/NotificationService';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const batches = await prisma.batch.findMany({
    orderBy: { purchaseDate: 'desc' },
    include: { 
      product: true, 
      productions: true,
      salesOrderItems: {
        where: { order: { status: { not: 'CANCELLED' } } }
      }
    },
  });

  const processed = batches.map(b => {
    // Omit salesOrderItems from response payload if not needed
    const { salesOrderItems, ...rest } = b;
    return { ...rest };
  });

  return jsonResponse({ data: processed });
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { productId, producedQty, sellingPrice, notes, purchaseDate, waxInitialQty, waxRate, waxStock, batchNumber: providedBatchNumber } = body;

    // Validation: Check if the most recent batch is fully consumed
    const latestBatch = await prisma.batch.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (latestBatch && latestBatch.remainingQty > 0) {
      return errorResponse(`Batch ${latestBatch.batchNumber} still has ${latestBatch.remainingQty} KG remaining. Complete this batch before creating the next batch.`, 400);
    }

    const count = await prisma.batch.count();
    const batchNumber = providedBatchNumber || `BATCH-${String(count).padStart(3, '0')}`;

    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        productId,
        producedQty: Number(producedQty || 0),
        remainingQty: Number(producedQty || 0),
        sellingPrice: Number(sellingPrice || 0),
        waxInitialQty: Number(waxInitialQty || 0),
        waxRate: Number(waxRate || 0),
        waxStock: Number(waxStock || 0),
        productionCost: Number(waxInitialQty || 0) * Number(waxRate || 0),
        status: 'IN_PRODUCTION',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      },
      include: { product: true },
    });

    // Fire Notification asynchronously
    NotificationService.broadcastToRole('PRODUCTION_MANAGER', {
      module: 'PRODUCTION',
      category: 'BATCH_STARTED',
      title: 'Production Batch Started',
      message: `Batch ${batch.batchNumber} started for ${batch.product?.name || 'Product'}. Quantity: ${batch.producedQty} KG`,
      referenceType: 'Batch',
      referenceId: batch.id,
      link: `/dashboard/batches`,
      icon: 'factory',
      color: 'green',
      createdById: user.id,
    }).catch(console.error);

    return jsonResponse(batch, 201, 'Batch created successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create batch', 400);
  }
}
