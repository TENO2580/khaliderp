const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTable() {
  // Get one order to see all columns and values
  const orders = await prisma.salesOrder.findMany({
    take: 3,
    orderBy: { orderDate: 'desc' },
    select: {
      orderNumber: true,
      subtotal: true,
      discount: true,
      discountPercent: true,
      taxableAmount: true,
      cgst: true,
      sgst: true,
      igst: true,
      totalGst: true,
      transportCharge: true,
      totalAmount: true,
      creditAmount: true,
      paidAmount: true,
      outstanding: true,
      notes: true,
    }
  });

  console.log('--- SALES_ORDERS TABLE: ALL FINANCIAL COLUMNS ---\n');
  
  for (const o of orders) {
    const notes = o.notes ? JSON.parse(o.notes) : {};
    console.log(`Order: ${o.orderNumber}`);
    console.log(`  subtotal:        ₹${o.subtotal}`);
    console.log(`  discount:        ₹${o.discount}`);
    console.log(`  discountPercent: ${o.discountPercent}%`);
    console.log(`  taxableAmount:   ₹${o.taxableAmount}`);
    console.log(`  cgst:            ₹${o.cgst}`);
    console.log(`  sgst:            ₹${o.sgst}`);
    console.log(`  igst:            ₹${o.igst}`);
    console.log(`  totalGst:        ₹${o.totalGst}`);
    console.log(`  transportCharge: ₹${o.transportCharge}`);
    console.log(`  totalAmount:     ₹${o.totalAmount}`);
    console.log(`  creditAmount:    ₹${o.creditAmount}`);
    console.log(`  paidAmount:      ₹${o.paidAmount}`);
    console.log(`  outstanding:     ₹${o.outstanding}`);
    console.log(`  --- From notes JSON ---`);
    console.log(`  sellingCost:     ${notes.sellingCost || 'N/A'}`);
    console.log(`  productionCost:  ${notes.productionCost || 'N/A'}`);
    console.log(`  profitAmt:       ${notes.profitAmt || 'N/A'}`);
    console.log(`  margin:          ${notes.margin || 'N/A'}`);
    console.log('');
  }

  await prisma.$disconnect();
}

checkTable().catch(console.error);
