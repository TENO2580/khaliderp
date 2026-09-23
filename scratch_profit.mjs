
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const rangeStart = new Date(2020, 0, 1, 0, 0, 0, 0);
  const rangeEnd = new Date(new Date().getFullYear() + 1, 11, 31, 23, 59, 59, 999);

  const rawData = await prisma.$queryRaw`
      SELECT 
        (SELECT COALESCE(SUM("totalAmount"), 0) FROM "sales_orders" WHERE "orderDate" >= ${rangeStart} AND "orderDate" <= ${rangeEnd}) as "periodSales",
        (SELECT COALESCE(SUM("amount"), 0) FROM "expenses" WHERE "date" >= ${rangeStart} AND "date" <= ${rangeEnd}) as "periodExpenses",
        (SELECT COALESCE(SUM("totalCost"), 0) FROM "productions" WHERE "date" >= ${rangeStart} AND "date" <= ${rangeEnd}) as "periodProductionCost"
    `;

  console.log("Raw Data:", rawData);

  const row = rawData[0];
  const periodSales = Number(row.periodSales || 0);
  const periodExpenses = Number(row.periodExpenses || 0);
  const periodProductionCost = Number(row.periodProductionCost || 0);
  const profit = periodSales - (periodProductionCost + periodExpenses);

  console.log("------------------------");
  console.log("Total Sales (Revenue)    : Rs", periodSales);
  console.log("Total Production Cost    : Rs", periodProductionCost);
  console.log("Total Expenses (General) : Rs", periodExpenses);
  console.log("------------------------");
  console.log("All-Time Profit          : Rs", profit);
}

main().catch(console.error).finally(() => prisma.$disconnect());

