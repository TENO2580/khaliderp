
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const prodCostSplit = await prisma.$queryRaw`
    SELECT 
      SUM("labourCost") as "labourCost",
      SUM("gasCost") as "gasCost",
      SUM("electricityCost") as "electricityCost",
      SUM("otherCosts") as "otherCosts",
      SUM("totalCost") as "totalCost"
    FROM productions
    WHERE "date" >= ${rangeStart} AND "date" <= ${rangeEnd}
  `;

  console.log("Prod Split:", prodCostSplit);
}

main().catch(console.error).finally(() => prisma.$disconnect());

