import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.upsert({
    where: { employeeId: 'EMP-BINOD' },
    update: {},
    create: {
      employeeId: 'EMP-BINOD',
      name: 'BINOD',
      department: 'Production',
      designation: 'Machine Operator',
      salary: 18000,
      joinDate: new Date('2026-01-01'),
      status: 'ACTIVE'
    }
  });
  console.log('Seeded employee:', emp);
}

main().catch(console.error).finally(() => prisma.$disconnect());
