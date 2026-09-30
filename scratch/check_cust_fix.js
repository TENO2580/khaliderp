
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
    const allCustomers = await prisma.customer.findMany({ select: { customerId: true } });
    let maxId = 0;
    for (const cust of allCustomers) {
      if (cust.customerId) {
        const match = cust.customerId.match(/^CUST-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxId) maxId = num;
        }
      }
    }
    const nextIdNum = maxId > 0 ? maxId + 1 : (await prisma.customer.count()) + 1;
    console.log("Next ID:", nextIdNum);
}
main().catch(console.error);

