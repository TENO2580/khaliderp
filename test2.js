const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const orders = await prisma.salesOrder.findMany({
    where: { status: 'DELIVERED', deliveryDate: null }
  });
  console.log(orders.length + ' delivered orders have null deliveryDate');
}
main().finally(() => prisma.$disconnect());
