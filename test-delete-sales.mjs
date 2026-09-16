import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const order = await prisma.salesOrder.findFirst();
  if(!order) { console.log('No order found'); return; }
  console.log('Trying to delete order:', order.id);
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const itemsToRevert = await tx.salesOrderItem.findMany({
        where: { orderId: order.id, batchId: { not: null } },
        select: { batchId: true, quantity: true }
      });

      const batchReversions = {};
      for (const item of itemsToRevert) {
        if (item.batchId) {
          batchReversions[item.batchId] = (batchReversions[item.batchId] || 0) + item.quantity;
        }
      }

      for (const [batchId, qty] of Object.entries(batchReversions)) {
        await tx.batch.update({
          where: { id: batchId },
          data: {
            soldQty: { decrement: qty },
            remainingQty: { increment: qty },
            status: 'PARTIALLY_SOLD'
          }
        });
      }

      const invoices = await tx.invoice.findMany({
        where: { orderId: order.id },
        select: { id: true }
      });
      const invoiceIds = invoices.map(i => i.id);

      if (invoiceIds.length > 0) {
        await tx.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
      }

      const deleteResult = await tx.salesOrder.deleteMany({
        where: { id: order.id }
      });

      return deleteResult;
    }, { maxWait: 5000, timeout: 20000 });
    console.log('Success:', result);
  } catch (err) {
    console.error('Error deleting sales orders:', err);
  }
}
main().finally(() => prisma.$disconnect());
