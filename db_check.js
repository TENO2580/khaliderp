const { PrismaClient } = require('@prisma/client'); 
const p = new PrismaClient(); 
p.salesOrder.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' }, take: 1 })
  .then(b => console.log(JSON.stringify(b, null, 2)))
  .catch(console.error)
  .finally(() => p.$disconnect());
