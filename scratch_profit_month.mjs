
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // We want to calculate the start and end of the current month (September 2026)
  // based on the system timezone
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  console.log("Range:", rangeStart, "to", rangeEnd);

  const rawData = await prisma.$queryRaw`
      SELECT 
        (SELECT COALESCE(SUM("totalAmount"), 0) FROM "sales_orders" WHERE "orderDate" >= ${rangeStart} AND "orderDate" <= ${rangeEnd}) as "periodSales",
        (SELECT COALESCE(SUM("amount"), 0) FROM "expenses" WHERE "date" >= ${rangeStart} AND "date" <= ${rangeEnd}) as "periodExpenses",
        (SELECT COALESCE(SUM("totalCost"), 0) FROM "productions" WHERE "date" >= ${rangeStart} AND "date" <= ${rangeEnd}) as "periodProductionCost"
    `;

  const row = rawData[0];
  const periodSales = Number(row.periodSales || 0);
  const periodExpenses = Number(row.periodExpenses || 0);
  const periodProductionCost = Number(row.periodProductionCost || 0);
  const profit = periodSales - (periodProductionCost + periodExpenses);

  console.log("------------------------");
  console.log("This Month Sales (Revenue)    : Rs", periodSales);
  console.log("This Month Production Cost    : Rs", periodProductionCost);
  console.log("This Month Expenses (General) : Rs", periodExpenses);
  console.log("------------------------");
  console.log("This Month Profit             : Rs", profit);
}

main().catch(console.error).finally(() => prisma.$disconnect());

