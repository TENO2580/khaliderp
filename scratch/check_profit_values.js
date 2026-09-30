const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const rangeStart = new Date(2026, 8, 1, 0, 0, 0, 0); // Sept 1, 2026
    const rangeEnd = new Date(2026, 8, 30, 23, 59, 59, 999);

    const rawData = await prisma.$queryRaw
      SELECT 
        (SELECT COALESCE(SUM("totalAmount"), 0) FROM "sales_orders" WHERE "orderDate" >= \ AND "orderDate" <= \) as "periodSales",
        (SELECT COALESCE(SUM("amount"), 0) FROM "expenses" WHERE "date" >= \ AND "date" <= \) as "periodExpenses",
        (SELECT COALESCE(SUM("totalCost"), 0) FROM "productions" WHERE "date" >= \ AND "date" <= \) as "periodProductionCost"
    ;
    
    console.log(rawData[0]);
}
main().catch(console.error);
