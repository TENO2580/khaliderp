
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const rangeStart = new Date(2026, 8, 1, 0, 0, 0, 0); 
    const rangeEnd = new Date(2026, 8, 30, 23, 59, 59, 999);

    const sales = await prisma.salesOrder.findMany({
        where: { orderDate: { gte: rangeStart, lte: rangeEnd } },
        select: { orderNumber: true, orderDate: true, totalAmount: true, status: true, customer: { select: { name: true } } },
        orderBy: { orderDate: "desc" }
    });

    const expenses = await prisma.expense.findMany({
        where: { date: { gte: rangeStart, lte: rangeEnd } },
        select: { date: true, amount: true, description: true, category: { select: { name: true } } },
        orderBy: { date: "desc" }
    });
    
    console.log("SALES_START");
    console.log(JSON.stringify(sales, null, 2));
    console.log("SALES_END");
    console.log("EXPENSES_START");
    console.log(JSON.stringify(expenses, null, 2));
    console.log("EXPENSES_END");
}
main().catch(console.error);

