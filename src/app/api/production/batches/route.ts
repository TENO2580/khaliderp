import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { NotificationService } from '@/lib/services/NotificationService';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const batches = await prisma.batch.findMany({
    orderBy: { productionDate: 'desc' },
    include: { 
      product: true, 
      productions: true,
      salesOrderItems: {
        where: { order: { status: { not: 'CANCELLED' } } }
      }
    },
  });

  const processed = batches.map(b => {
    const soldQty = b.salesOrderItems.reduce((acc, item) => acc + item.quantity, 0);
    const remainingQty = Math.max(0, b.producedQty - soldQty);
    let status = 'IN_PRODUCTION';
    if (b.producedQty > 0 && remainingQty === 0) status = 'COMPLETED';
    
    // Omit salesOrderItems from response payload if not needed
    const { salesOrderItems, ...rest } = b;
    return { ...rest, soldQty, remainingQty, status };
  });

  return jsonResponse({ data: processed });
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { productId, producedQty, sellingPrice, notes, productionDate, waxUsed, costPerKg, productionCost } = body;

    // Validation: Check if the most recent batch is fully consumed
    const latestBatch = await prisma.batch.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        salesOrderItems: {
          where: { order: { status: { not: 'CANCELLED' } } }
        }
      }
    });

    if (latestBatch) {
      const soldQty = latestBatch.salesOrderItems.reduce((acc, item) => acc + item.quantity, 0);
      const remainingQty = latestBatch.producedQty - soldQty;
      if (remainingQty > 0) {
        return errorResponse(`Batch ${latestBatch.batchNumber} still has ${remainingQty} KG remaining. Complete this batch before creating the next batch.`, 400);
      }
    }

    const count = await prisma.batch.count();
    const batchNumber = `BATCH-${String(count).padStart(3, '0')}`; // BATCH-000, BATCH-001...

    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        productId,
        producedQty: Number(producedQty || 0),
        remainingQty: Number(producedQty || 0),
        sellingPrice: Number(sellingPrice || 0),
        waxUsed: Number(waxUsed || 0),
        costPerKg: Number(costPerKg || 0),
        productionCost: Number(productionCost || 0),
        status: 'IN_PRODUCTION',
        productionDate: productionDate ? new Date(productionDate) : new Date(),
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
