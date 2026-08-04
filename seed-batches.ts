import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting existing batches...');
  await prisma.batch.deleteMany({});

  console.log('Inserting new batches...');
  
  await prisma.batch.create({
    data: {
      batchNumber: 'BATCH ZERO',
      purchaseDate: new Date('2026-07-01'),
      waxInitialQty: 250,
      waxRate: 173,
      sellingPrice: 203,
      producedQty: 250,
      soldQty: 250,
      remainingQty: 0,
      waxStock: 0,
      productionCost: 43250,
      status: 'COMPLETED'
    }
  });

  await prisma.batch.create({
    data: {
      batchNumber: 'BATCH ONE',
      purchaseDate: new Date('2026-07-23'),
      waxInitialQty: 500,
      waxRate: 157,
      sellingPrice: 195,
      producedQty: 500,
      soldQty: 500,
      remainingQty: 0,
      waxStock: 0,
      productionCost: 78500,
      status: 'COMPLETED'
    }
  });

  await prisma.batch.create({
    data: {
      batchNumber: 'BATCH TWO',
      purchaseDate: new Date('2026-07-31'),
      waxInitialQty: 1600,
      waxRate: 154,
      sellingPrice: 195,
      producedQty: 175,
      soldQty: 131,
      remainingQty: 44,
      waxStock: 1425,
      productionCost: 246400,
      status: 'IN_PRODUCTION'
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
