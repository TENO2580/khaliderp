const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting full batch recalculation & migration...');

  // 1. Reset all batches
  await prisma.batch.updateMany({
    data: {
      soldQty: 0,
      status: 'COMPLETED'
    }
  });

  const allBatchesRaw = await prisma.batch.findMany();
  for (const b of allBatchesRaw) {
    await prisma.batch.update({
      where: { id: b.id },
      data: { remainingQty: b.producedQty }
    });
  }
  console.log('Reset all batches to 0 sold.');

  // 2. Clear all batch allocations on order items, except we can just fetch all of them
  const allItems = await prisma.salesOrderItem.findMany({
    orderBy: { createdAt: 'asc' },
    include: { order: true }
  });

  console.log(`Found ${allItems.length} total items.`);

  for (const item of allItems) {
    if (item.order.status === 'CANCELLED') {
      console.log(`Skipping cancelled order item ${item.id}`);
      continue;
    }

    // Reset its batchId first so we don't accidentally keep bad references if we fail to allocate
    await prisma.salesOrderItem.update({
      where: { id: item.id },
      data: { batchId: null }
    });

    console.log(`\nProcessing item ${item.id} (Qty: ${item.quantity}) for order ${item.order.orderNumber}`);

    let qtyToAllocate = item.quantity;
    
    // Find available batches
    const availableBatches = await prisma.batch.findMany({
      where: {
        status: { in: ['IN_PRODUCTION', 'COMPLETED', 'PARTIALLY_SOLD'] },
        remainingQty: { gt: 0 }
      },
      orderBy: { purchaseDate: 'asc' }
    });

    const productBatches = availableBatches.filter(b => 
      (b.productId === item.productId || b.productId === null) && b.remainingQty > 0
    );

    if (productBatches.length === 0 && qtyToAllocate > 0) {
      console.warn(`WARNING: No available batches for item ${item.id}. Cannot allocate.`);
      continue;
    }

    let firstAllocation = true;

    for (const batch of productBatches) {
      if (qtyToAllocate <= 0) break;

      const allocatedQty = Math.min(qtyToAllocate, batch.remainingQty);
      console.log(`  -> Allocating ${allocatedQty} from Batch ${batch.batchNumber}`);
      
      const ratio = allocatedQty / item.quantity;
      const splitDiscount = Number(((item.discount || 0) * ratio).toFixed(2));
      const splitAmount = Number(((allocatedQty * item.unitPrice) - splitDiscount).toFixed(2));
      const splitGst = Number((splitAmount * (item.gstRate / 100)).toFixed(2));

      await prisma.$transaction(async (tx) => {
        // Update batch remaining/sold quantities
        const newRemaining = batch.remainingQty - allocatedQty;
        const newSold = batch.soldQty + allocatedQty;
        let newStatus = batch.status;
        if (newRemaining <= 0) newStatus = 'FULLY_SOLD';
        else if (newSold > 0) newStatus = 'PARTIALLY_SOLD';

        await tx.batch.update({
          where: { id: batch.id },
          data: {
            soldQty: newSold,
            remainingQty: newRemaining,
            status: newStatus
          }
        });
        
        // Update our local reference so next items in the loop see the new qty
        batch.remainingQty = newRemaining;
        batch.soldQty = newSold;
        batch.status = newStatus;

        if (firstAllocation) {
          await tx.salesOrderItem.update({
            where: { id: item.id },
            data: {
              batchId: batch.id,
              quantity: allocatedQty,
              discount: splitDiscount,
              amount: splitAmount,
              gstAmount: splitGst,
            }
          });
          firstAllocation = false;
        } else {
          await tx.salesOrderItem.create({
            data: {
              orderId: item.orderId,
              productId: item.productId,
              batchId: batch.id,
              quantity: allocatedQty,
              unitPrice: item.unitPrice,
              discount: splitDiscount,
              gstRate: item.gstRate,
              gstAmount: splitGst,
              amount: splitAmount,
              createdAt: item.createdAt
            }
          });
        }
      });

      qtyToAllocate -= allocatedQty;
    }

    if (qtyToAllocate > 0) {
      console.warn(`WARNING: Could not fully allocate item ${item.id}. Short by ${qtyToAllocate} KG.`);
    }
  }

  console.log('\nMigration complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
