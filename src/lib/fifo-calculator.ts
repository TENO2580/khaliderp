import prisma from '@/lib/db';

export interface FifoMappingResult {
  orderToBatches: Record<string, string>; // Order ID -> "Batch 1, Batch 2"
  batchToOrders: Record<string, string>;  // Batch ID -> "SO-001, SO-002"
}

let fifoCache: { result: FifoMappingResult; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60000; // 60 seconds

/**
 * Calculates strict FIFO assignments based purely on cumulative threshold limits,
 * entirely ignoring database foreign keys to rebuild a strict chronological timeline.
 */
export async function calculateStrictFifoMapping(forceRefresh = false): Promise<FifoMappingResult> {
  const now = Date.now();
  if (!forceRefresh && fifoCache && fifoCache.expiresAt > now) {
    return fifoCache.result;
  }

  const result: FifoMappingResult = {
    orderToBatches: {},
    batchToOrders: {}
  };

  // 1. Fetch all non-cancelled orders with their item quantities, sorted chronologically
  const orders = await prisma.salesOrder.findMany({
    where: { status: { not: 'CANCELLED' } },
    include: { items: true },
    orderBy: { orderDate: 'asc' }
  });

  // 2. Fetch all batches sorted chronologically
  const batches = await prisma.batch.findMany({
    orderBy: { purchaseDate: 'asc' }
  });

  // Track the cumulative threshold we are currently sitting at in the batches
  let currentBatchIndex = 0;
  let currentBatchUsedQty = 0;

  for (const order of orders) {
    const orderTotalQty = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    if (orderTotalQty === 0) continue;

    let remainingOrderQtyToFulfill = orderTotalQty;
    const assignedBatchNumbers: string[] = [];

    // Consume batches sequentially until order is fulfilled
    while (remainingOrderQtyToFulfill > 0 && currentBatchIndex < batches.length) {
      const currentBatch = batches[currentBatchIndex];
      // The capacity of this batch is its total produced quantity
      const batchCapacity = currentBatch.producedQty || 0;
      
      const batchRemainingAvailable = batchCapacity - currentBatchUsedQty;

      if (batchRemainingAvailable <= 0) {
        // This batch is fully depleted, move to next
        currentBatchIndex++;
        currentBatchUsedQty = 0;
        continue;
      }

      // Calculate how much this batch can fulfill for this order
      const consumedQty = Math.min(remainingOrderQtyToFulfill, batchRemainingAvailable);
      
      if (!assignedBatchNumbers.includes(currentBatch.batchNumber)) {
        assignedBatchNumbers.push(currentBatch.batchNumber);
      }

      // Add order to batch's list
      if (!result.batchToOrders[currentBatch.id]) {
        result.batchToOrders[currentBatch.id] = order.orderNumber;
      } else {
        if (!result.batchToOrders[currentBatch.id].includes(order.orderNumber)) {
          result.batchToOrders[currentBatch.id] += `, ${order.orderNumber}`;
        }
      }

      remainingOrderQtyToFulfill -= consumedQty;
      currentBatchUsedQty += consumedQty;

      // If batch is exactly depleted by this order, we can queue up the next batch for the next loop iteration
      if (currentBatchUsedQty >= batchCapacity) {
        currentBatchIndex++;
        currentBatchUsedQty = 0;
      }
    }

    result.orderToBatches[order.id] = assignedBatchNumbers.length > 0 
      ? assignedBatchNumbers.join(', ') 
      : 'Unfulfilled';
  }

  fifoCache = {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS
  };

  return result;
}
