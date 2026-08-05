const { PrismaClient } = require('@prisma/client'); 
const p = new PrismaClient(); 
p.batch.findMany({ orderBy: { purchaseDate: 'asc' } }).then(b => console.log(b.map(x => ({ batch: x.batchNumber, date: x.purchaseDate, remaining: x.remainingQty, id: x.id })))).finally(() => p.$disconnect());
