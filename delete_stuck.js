const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.company.deleteMany({
    where: { name: 'smartup learning' }
  });
  console.log('Deleted', result.count, 'companies');
}
main().catch(console.error).finally(() => prisma.$disconnect());
