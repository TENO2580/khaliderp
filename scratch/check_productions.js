
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const rangeStart = new Date(2026, 8, 1, 0, 0, 0, 0); 
    const rangeEnd = new Date(2026, 8, 30, 23, 59, 59, 999);

    const productions = await prisma.production.findMany({
        where: { date: { gte: rangeStart, lte: rangeEnd } },
        select: {
            id: true,
            date: true,
            totalCost: true,
            quantityProduced: true,
            batch: {
                select: {
                    batchNumber: true,
                    product: {
                        select: { name: true }
                    }
                }
            }
        },
        orderBy: { date: "desc" }
    });
    
    console.log(JSON.stringify(productions, null, 2));
}
main().catch(console.error);

