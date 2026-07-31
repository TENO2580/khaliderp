const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const batches = [
    {
      batchNumber: 'BATCH ZERO',
      productionDate: new Date('2026-07-01T00:00:00Z'),
      waxUsed: 250,
      costPerKg: 173,
      productionCost: 43250,
      sellingPrice: 203,
      producedQty: 250,
      soldQty: 250,
      remainingQty: 0,
      profit: 7500,
      status: 'COMPLETED'
    },
    {
      batchNumber: 'BATCH ONE',
      productionDate: new Date('2026-07-23T00:00:00Z'),
      waxUsed: 375,
      costPerKg: 157,
      productionCost: 58875,
      sellingPrice: 198,
      producedQty: 375,
      soldQty: 375,
      remainingQty: 0,
      profit: 15375,
      status: 'COMPLETED'
    },
    {
      batchNumber: 'BATCH TWO',
      productionDate: new Date('2026-07-31T00:00:00Z'),
      waxUsed: 0,
      costPerKg: 154,
      productionCost: 0,
      sellingPrice: 198,
      producedQty: 0,
      soldQty: 0,
      remainingQty: 0,
      profit: 0,
      status: 'IN_PRODUCTION'
    }
  ];

  for (const batch of batches) {
    await prisma.batch.upsert({
      where: { batchNumber: batch.batchNumber },
      update: batch,
      create: batch
    });
  }
  console.log('Batches seeded successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
