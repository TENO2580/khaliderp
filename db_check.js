const { PrismaClient } = require('@prisma/client'); 
const p = new PrismaClient(); 
p.batch.findMany({ orderBy: { purchaseDate: 'asc' } })
  .then(b => {
    const res = b.map(x => ({ batch: x.batchNumber, date: x.purchaseDate, db_remaining: x.remainingQty, id: x.id }));
    console.log(JSON.stringify(res, null, 2));
  })
  .catch(console.error)
  .finally(() => p.$disconnect());
