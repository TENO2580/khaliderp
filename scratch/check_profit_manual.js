const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Range: 2026-09-01 to 2026-09-30 (since now is 2026-09-29)
    const rangeStart = new Date(2026, 8, 1, 0, 0, 0, 0); // Month is 0-indexed in JS (8 = Sept)
    const rangeEnd = new Date(2026, 8, 30, 23, 59, 59, 999);

    const sales = await prisma.sale.aggregate({
        where: { orderDate: { gte: rangeStart, lte: rangeEnd } },
        _sum: { totalAmount: true }
    });

    const expenses = await prisma.expense.aggregate({
        where: { date: { gte: rangeStart, lte: rangeEnd } },
        _sum: { amount: true }
    });

    // Production cost: how is periodProductionCost calculated in route.ts?
    // Let's get the raw production cost
    const productions = await prisma.production.aggregate({
        where: { date: { gte: rangeStart, lte: rangeEnd } },
        _sum: { totalCost: true }
    });
    
    // Also, Sales items have production cost? 
    // In SalesModule.tsx, we saw editFormData.productionCostPerUnit
    // Let's check the SQL query from route.ts to be sure!
    console.log({
      sales: sales._sum.totalAmount,
      expenses: expenses._sum.amount,
      productions: productions._sum.totalCost
    });
}
main().catch(console.error);
