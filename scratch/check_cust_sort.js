
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
    const latest = await prisma.customer.findFirst({ orderBy: { customerId: "desc" }});
    console.log("Latest by customerId desc:", latest ? latest.customerId : null);
}
main().catch(console.error);

