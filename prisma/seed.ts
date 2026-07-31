import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Initial Authorized Users ──────────────────────
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const initialUsers = [
    {
      email: 'tenogte@gmail.com',
      name: 'Tenogte',
      role: 'SUPER_ADMIN' as const,
      isActive: true,
    },
    {
      email: 'khalidshantp@gmail.com',
      name: 'Khalid',
      role: 'ADMIN' as const,
      isActive: true,
    },
    {
      email: 'admin@khaliderp.com',
      name: 'Admin',
      role: 'SUPER_ADMIN' as const,
      isActive: true,
    },
  ];

  for (const u of initialUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, isActive: true },
      create: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role,
        isActive: true,
      },
    });
  }
  console.log('✅ Initial authorized users created (tenogte@gmail.com & khalidshantp@gmail.com)');



  // ─── Company Settings ──────────────────────────────
  const settings = [
    { key: 'company_name', value: 'Khalid Candle Manufacturing', group: 'company', label: 'Company Name', type: 'text' },
    { key: 'company_address', value: 'Chennai, Tamil Nadu, India', group: 'company', label: 'Company Address', type: 'text' },
    { key: 'company_phone', value: '+91 98765 43210', group: 'company', label: 'Phone', type: 'text' },
    { key: 'company_email', value: 'info@khalidcandles.com', group: 'company', label: 'Email', type: 'text' },
    { key: 'company_gst', value: '33AABCT0000A1ZA', group: 'company', label: 'GST Number', type: 'text' },
    { key: 'company_state', value: 'Tamil Nadu', group: 'company', label: 'State', type: 'text' },
    { key: 'company_state_code', value: '33', group: 'company', label: 'State Code', type: 'text' },
    { key: 'financial_year_start', value: '04', group: 'financial', label: 'FY Start Month', type: 'text' },
    { key: 'invoice_prefix', value: 'INV', group: 'invoice', label: 'Invoice Prefix', type: 'text' },
    { key: 'default_gst_rate', value: '18', group: 'tax', label: 'Default GST Rate', type: 'number' },
    { key: 'currency', value: 'INR', group: 'general', label: 'Currency', type: 'text' },
    { key: 'currency_symbol', value: '₹', group: 'general', label: 'Currency Symbol', type: 'text' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ Company settings created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('📧 Admin login: admin@khaliderp.com / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
