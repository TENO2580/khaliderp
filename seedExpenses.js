// Seed script to add expense data from the user's spreadsheet
// Run: node seedExpenses.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Ensure expense categories exist
  const categoryNames = ['PARAFFIN WAX', 'TRAVELLING', 'ADVERTISING', 'WAX'];
  const categoryMap = {};

  for (const name of categoryNames) {
    let cat = await prisma.expenseCategory.findFirst({ where: { name } });
    if (!cat) {
      cat = await prisma.expenseCategory.create({ data: { name, isActive: true } });
      console.log(`Created category: ${name}`);
    }
    categoryMap[name] = cat.id;
  }

  // 2. Get the first user (admin) to be the creator
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('No user found! Please log in at least once first.');
    process.exit(1);
  }

  // 3. Define the expense data from the spreadsheet
  const expenseData = [
    { date: '2026-07-23', category: 'PARAFFIN WAX', amount: 78500, paymentMethod: 'BANK TRANSFER', notes: 'SOUTHERN CHEI SAHAYAMATHA' },
    { date: '2026-07-23', category: 'TRAVELLING', amount: 500, paymentMethod: 'BANK TRANSFER', notes: 'FUEL' },
    { date: '2026-07-24', category: 'ADVERTISING', amount: 800, paymentMethod: 'BANK TRANSFER', notes: 'JOB VACANCY' },
    { date: '2026-07-25', category: 'TRAVELLING', amount: 200, paymentMethod: '', notes: 'FUEL' },
    { date: '2026-07-27', category: 'TRAVELLING', amount: 200, paymentMethod: '', notes: 'FUEL' },
    { date: '2026-07-28', category: 'TRAVELLING', amount: 500, paymentMethod: '', notes: 'FUEL' },
    { date: '2026-07-30', category: 'WAX', amount: 154000, paymentMethod: 'BANK TRANSFER', notes: '' },
  ];

  // 4. Insert expenses
  for (const exp of expenseData) {
    const description = [exp.notes, exp.paymentMethod ? `Payment: ${exp.paymentMethod}` : ''].filter(Boolean).join(' | ');
    
    await prisma.expense.create({
      data: {
        categoryId: categoryMap[exp.category],
        amount: exp.amount,
        date: new Date(exp.date),
        description: description || `${exp.category} expense`,
        createdById: user.id,
        status: 'APPROVED',
      },
    });
    console.log(`✓ Added: ${exp.date} | ${exp.category} | ₹${exp.amount.toLocaleString('en-IN')}`);
  }

  console.log('\n✅ All expenses seeded successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
