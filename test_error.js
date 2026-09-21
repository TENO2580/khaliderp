const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const lastImport = await prisma.importHistory.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log(JSON.stringify(JSON.parse(lastImport.errors).slice(0, 5), null, 2));
}
main().finally(() => prisma.$disconnect());
