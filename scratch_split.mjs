
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const expensesByCategory = await prisma.$queryRaw`
    SELECT c.name as category, SUM(e.amount) as total
    FROM expenses e
    JOIN expense_categories c ON e."categoryId" = c.id
    GROUP BY c.name
    ORDER BY total DESC
  `;

  const productionCosts = await prisma.$queryRaw`
    SELECT 
      SUM("labourCost") as "labourCost",
      SUM("gasCost") as "gasCost",
      SUM("electricityCost") as "electricityCost",
      SUM("otherCosts") as "otherCosts",
      SUM("totalCost") as "totalCost"
    FROM productions
  `;

  console.log("EXPENSES_JSON=" + JSON.stringify(expensesByCategory));
  console.log("PROD_JSON=" + JSON.stringify(productionCosts));
}

main().catch(console.error).finally(() => prisma.$disconnect());

