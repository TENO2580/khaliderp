import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.batch.deleteMany({});
  console.log("Deleted all batches.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
