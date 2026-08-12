const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const startDate = '2026-08-11';
  const endDate = '2026-08-11';
  const where = { createdAt: {} };
  
  const d1 = new Date(startDate);
  where.createdAt.gte = new Date(d1.setHours(0,0,0,0));
  
  const d2 = new Date(endDate);
  where.createdAt.lte = new Date(d2.setHours(23,59,59,999));
  
  console.log('Query:', where);
  const res = await prisma.customer.count({where});
  console.log('Count:', res);
  
  const total = await prisma.customer.count();
  console.log('Total Count:', total);
}

main().finally(() => prisma.$disconnect());
