const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT COALESCE(SUM(
      ("waxStock" * "waxRate") + 
      COALESCE("remainingQty" * (("waxInitialQty" - "waxStock") * "waxRate") / NULLIF("producedQty", 0), 0)
    ), 0) as "inventoryValue"
    FROM "batches"
  `;
  
  console.log(result);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
