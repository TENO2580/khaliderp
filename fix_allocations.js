const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deliveredOrders = await prisma.salesOrder.findMany({
    where: { status: 'DELIVERED' },
    include: { items: true }
  });

  console.log(`Found ${deliveredOrders.length} delivered orders.`);

  let totalAllocated = 0;

  for (const order of deliveredOrders) {
    for (const item of order.items) {
      if (item.batchId) continue;

      let qtyToAllocate = item.quantity;
      if (qtyToAllocate <= 0) continue;

      const originalQty = item.quantity;

      const allBatches = await prisma.batch.findMany({
        orderBy: { productionDate: 'asc' },
        include: { salesOrderItems: { where: { order: { status: 'DELIVERED' } } } }
      });

      const batchesWithRemaining = allBatches.map(b => {
        const sold = b.salesOrderItems.reduce((acc, curr) => acc + curr.quantity, 0);
        return { ...b, remainingQty: b.producedQty - sold };
      }).filter(b => b.remainingQty > 0);

      let firstAllocation = true;

      for (const batch of batchesWithRemaining) {
        if (qtyToAllocate <= 0) break;

        const allocatedQty = Math.min(qtyToAllocate, batch.remainingQty);
        const ratio = allocatedQty / originalQty;

        const splitDiscount = Number(((item.discount || 0) * ratio).toFixed(2));
        const splitAmount = Number(((allocatedQty * item.unitPrice) - splitDiscount).toFixed(2));
        const splitGst = Number((splitAmount * (item.gstRate / 100)).toFixed(2));

        if (firstAllocation) {
          await prisma.salesOrderItem.update({
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
          await prisma.salesOrderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              batchId: batch.id,
              quantity: allocatedQty,
              unitPrice: item.unitPrice,
              discount: splitDiscount,
              gstRate: item.gstRate,
              gstAmount: splitGst,
              amount: splitAmount,
            }
          });
        }
        
        qtyToAllocate -= allocatedQty;
        totalAllocated += allocatedQty;
      }
      
      if (qtyToAllocate > 0) {
        console.log(`Could not allocate ${qtyToAllocate} for item ${item.id}.`);
      }
    }
  }

  console.log(`Allocated ${totalAllocated} units successfully.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
