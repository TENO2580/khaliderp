import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  console.time('Connect');
  await prisma.$connect();
  console.timeEnd('Connect');

  console.time('Query1');
  await prisma.user.findFirst();
  console.timeEnd('Query1');

  console.time('Query2');
  await prisma.user.findFirst();
  console.timeEnd('Query2');
}
run().catch(console.error).finally(() => prisma.$disconnect());
