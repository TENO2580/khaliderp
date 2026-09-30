const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Sum Sales
    const sales = await prisma.sale.aggregate({
        where: { orderDate: { gte: startOfMonth } },
        _sum: { totalAmount: true }
    });
    
    // Sum Expenses
    const expenses = await prisma.expense.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true }
    });
    
    // Production cost (depends on how it's calculated in route.ts)
    // Let's check how periodProductionCost is calculated in route.ts!
}
main().catch(console.error);
