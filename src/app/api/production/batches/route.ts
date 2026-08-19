import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { NotificationService } from '@/lib/services/NotificationService';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const batches = await prisma.batch.findMany({
    orderBy: [
      { batchNumber: 'asc' },
      { purchaseDate: 'asc' },
      { createdAt: 'asc' },
    ],
    take: limit,
    include: { 
      product: true, 
      productions: true,
    },
  });

  return jsonResponse({ data: batches });
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { productId, producedQty, sellingPrice, notes, purchaseDate, waxInitialQty, waxRate, waxStock, batchNumber: providedBatchNumber } = body;

    // Validation removed: User requested to allow creating a new batch even if the previous batch has remaining stock.

    const count = await prisma.batch.count();
    const batchNumber = providedBatchNumber || `BATCH-${String(count).padStart(3, '0')}`;

    const initialWaxQty = Number(waxInitialQty || 0);
    const initialWaxStock = (waxStock !== undefined && waxStock !== null && waxStock !== '')
      ? Number(waxStock)
      : initialWaxQty;

    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        productId,
        producedQty: Number(producedQty || 0),
        remainingQty: Number(producedQty || 0),
        sellingPrice: Number(sellingPrice || 0),
        waxInitialQty: initialWaxQty,
        waxRate: Number(waxRate || 0),
        waxStock: initialWaxStock,
        productionCost: initialWaxQty * Number(waxRate || 0),
        status: 'IN_PRODUCTION',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      },
      include: { product: true },
    });

    // Automatically sync the waxRate to the Unit Economics profile
    if (waxRate !== undefined && waxRate !== null) {
      try {
        const defaultProfile = await prisma.costingProfile.findFirst({
          orderBy: { updatedAt: 'desc' }
        });
        if (defaultProfile) {
          await prisma.costingProfile.update({
            where: { id: defaultProfile.id },
            data: { waxCost: Number(waxRate) }
          });
        }
      } catch (profileErr) {
        console.error("Failed to sync waxRate to CostingProfile", profileErr);
      }
    }

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
