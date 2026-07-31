const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deliveredOrders = await prisma.salesOrder.findMany({
    where: { status: 'DELIVERED' }
  });
  
  for (const order of deliveredOrders) {
    await prisma.invoice.upsert({
      where: { orderId: order.id },
      update: {
        subtotal: order.subtotal,
        cgst: order.cgst,
        sgst: order.sgst,
        igst: order.igst,
        totalGst: order.totalGst,
        transportCharge: order.transportCharge,
        totalAmount: order.totalAmount,
        outstanding: order.outstanding,
        paidAmount: order.paidAmount,
      },
      create: {
        invoiceNumber: `INV-${order.orderNumber}`,
        orderId: order.id,
        customerId: order.customerId,
        subtotal: order.subtotal,
        cgst: order.cgst,
        sgst: order.sgst,
        igst: order.igst,
        totalGst: order.totalGst,
        transportCharge: order.transportCharge,
        totalAmount: order.totalAmount,
        outstanding: order.outstanding,
        paidAmount: order.paidAmount,
        status: 'ISSUED',
      }
    });
  }
  console.log(`Synced ${deliveredOrders.length} delivered orders to invoices.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
