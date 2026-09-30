
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
    const c = await prisma.customer.count();
    const latest = await prisma.customer.findFirst({ orderBy: { createdAt: "desc" }});
    console.log("Count:", c);
    console.log("Latest:", latest ? latest.customerId : null);
}
main().catch(console.error);

