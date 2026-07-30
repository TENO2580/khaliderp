import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Admin User ───────────────────────────────────
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@khaliderp.com' },
    update: {},
    create: {
      email: 'admin@khaliderp.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create sample users for each role
  const roles = [
    { email: 'production@khaliderp.com', name: 'Production Manager', role: 'PRODUCTION_MANAGER' as const },
    { email: 'sales@khaliderp.com', name: 'Sales Executive', role: 'SALES_EXECUTIVE' as const },
    { email: 'warehouse@khaliderp.com', name: 'Warehouse Manager', role: 'WAREHOUSE' as const },
    { email: 'accounts@khaliderp.com', name: 'Accountant', role: 'ACCOUNTANT' as const },
  ];

  for (const role of roles) {
    await prisma.user.upsert({
      where: { email: role.email },
      update: {},
      create: {
        email: role.email,
        password: hashedPassword,
        name: role.name,
        role: role.role,
        isActive: true,
      },
    });
  }
  console.log('✅ Sample users created');

  // ─── Expense Categories ────────────────────────────
  const categories = [
    { name: 'Travel', icon: 'plane', color: '#3B82F6' },
    { name: 'Fuel', icon: 'fuel', color: '#F59E0B' },
    { name: 'Salary', icon: 'banknote', color: '#10B981' },
    { name: 'Advertising', icon: 'megaphone', color: '#8B5CF6' },
    { name: 'Electricity', icon: 'zap', color: '#EF4444' },
    { name: 'Gas', icon: 'flame', color: '#F97316' },
    { name: 'Office', icon: 'building', color: '#6366F1' },
    { name: 'Raw Materials', icon: 'package', color: '#14B8A6' },
    { name: 'Miscellaneous', icon: 'more-horizontal', color: '#64748B' },
  ];

  for (const cat of categories) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Expense categories created');

  // ─── Raw Materials ─────────────────────────────────
  const rawMaterials = [
    { name: 'Paraffin Wax', category: 'WAX' as const, unit: 'KG', currentStock: 500, minimumStock: 100, reorderLevel: 150, unitCost: 85 },
    { name: 'Soy Wax', category: 'WAX' as const, unit: 'KG', currentStock: 200, minimumStock: 50, reorderLevel: 80, unitCost: 120 },
    { name: 'Red Dye', category: 'COLOR' as const, unit: 'KG', currentStock: 20, minimumStock: 5, reorderLevel: 8, unitCost: 250 },
    { name: 'Blue Dye', category: 'COLOR' as const, unit: 'KG', currentStock: 15, minimumStock: 5, reorderLevel: 8, unitCost: 250 },
    { name: 'Lavender Fragrance', category: 'FRAGRANCE' as const, unit: 'LTR', currentStock: 30, minimumStock: 10, reorderLevel: 15, unitCost: 400 },
    { name: 'Vanilla Fragrance', category: 'FRAGRANCE' as const, unit: 'LTR', currentStock: 25, minimumStock: 10, reorderLevel: 15, unitCost: 350 },
    { name: 'Glass Jar 200ml', category: 'CONTAINER' as const, unit: 'PCS', currentStock: 1000, minimumStock: 200, reorderLevel: 300, unitCost: 25 },
    { name: 'Glass Jar 500ml', category: 'CONTAINER' as const, unit: 'PCS', currentStock: 800, minimumStock: 200, reorderLevel: 300, unitCost: 40 },
    { name: 'Cotton Wick 6"', category: 'WICK' as const, unit: 'PCS', currentStock: 5000, minimumStock: 1000, reorderLevel: 1500, unitCost: 2 },
    { name: 'Wooden Wick', category: 'WICK' as const, unit: 'PCS', currentStock: 2000, minimumStock: 500, reorderLevel: 800, unitCost: 8 },
    { name: 'Gift Box Small', category: 'BOX' as const, unit: 'PCS', currentStock: 500, minimumStock: 100, reorderLevel: 150, unitCost: 15 },
    { name: 'Printed Label', category: 'LABEL' as const, unit: 'PCS', currentStock: 3000, minimumStock: 500, reorderLevel: 800, unitCost: 3 },
  ];

  for (const mat of rawMaterials) {
    await prisma.rawMaterial.upsert({
      where: { id: mat.name }, // will fail, use create
      update: {},
      create: mat,
    }).catch(() => {
      return prisma.rawMaterial.create({ data: mat });
    });
  }
  console.log('✅ Raw materials created');

  // ─── Products ──────────────────────────────────────
  const products = [
    { name: 'Lavender Soy Candle 200g', sku: 'CNDL-LAV-200', category: 'Scented Candles', unit: 'PCS', hsnCode: '3406', gstRate: 18, sellingPrice: 350 },
    { name: 'Vanilla Bean Candle 500g', sku: 'CNDL-VAN-500', category: 'Scented Candles', unit: 'PCS', hsnCode: '3406', gstRate: 18, sellingPrice: 650 },
    { name: 'Classic White Pillar 1kg', sku: 'CNDL-WHT-1K', category: 'Pillar Candles', unit: 'KG', hsnCode: '3406', gstRate: 18, sellingPrice: 180 },
    { name: 'Rose Garden Candle 200g', sku: 'CNDL-RSE-200', category: 'Scented Candles', unit: 'PCS', hsnCode: '3406', gstRate: 18, sellingPrice: 380 },
    { name: 'Citrus Fresh Candle 300g', sku: 'CNDL-CTR-300', category: 'Scented Candles', unit: 'PCS', hsnCode: '3406', gstRate: 18, sellingPrice: 420 },
  ];

  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });

    // Create inventory entry for each product
    await prisma.inventory.upsert({
      where: { productId: created.id },
      update: {},
      create: {
        productId: created.id,
        currentStock: Math.floor(Math.random() * 200) + 50,
        minimumStock: 20,
        reorderLevel: 50,
        unitCost: product.sellingPrice * 0.4,
        value: 0,
      },
    });
  }
  console.log('✅ Products & inventory created');

  // ─── Sample Customers ──────────────────────────────
  const customers = [
    { customerId: 'CUST-0001', name: 'Aroma House', ownerName: 'Rajesh Kumar', phone: '9876543210', type: 'DISTRIBUTOR' as const, state: 'Tamil Nadu', district: 'Chennai', status: 'ACTIVE' as const, creditLimit: 100000 },
    { customerId: 'CUST-0002', name: 'Candle World', ownerName: 'Priya Sharma', phone: '9876543211', type: 'RETAILER' as const, state: 'Tamil Nadu', district: 'Coimbatore', status: 'ACTIVE' as const, creditLimit: 50000 },
    { customerId: 'CUST-0003', name: 'Gift Gallery', ownerName: 'Suresh Patel', phone: '9876543212', type: 'WHOLESALER' as const, state: 'Karnataka', district: 'Bangalore', status: 'ACTIVE' as const, creditLimit: 200000 },
    { customerId: 'CUST-0004', name: 'Home Decor Plus', ownerName: 'Anita Reddy', phone: '9876543213', type: 'RETAILER' as const, state: 'Tamil Nadu', district: 'Madurai', status: 'LEAD' as const, creditLimit: 30000 },
    { customerId: 'CUST-0005', name: 'Festival Lights', ownerName: 'Mohammed Ali', phone: '9876543214', type: 'DEALER' as const, state: 'Kerala', district: 'Kochi', status: 'ACTIVE' as const, creditLimit: 150000 },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { customerId: customer.customerId },
      update: {},
      create: customer,
    });
  }
  console.log('✅ Sample customers created');

  // ─── Sample Employees ──────────────────────────────
  const employees = [
    { employeeId: 'EMP-0001', name: 'Ravi Kumar', phone: '9876543220', designation: 'Production Lead', department: 'Production', salary: 25000, joinDate: new Date('2024-01-15') },
    { employeeId: 'EMP-0002', name: 'Lakshmi Devi', phone: '9876543221', designation: 'Machine Operator', department: 'Production', salary: 18000, joinDate: new Date('2024-03-01') },
    { employeeId: 'EMP-0003', name: 'Arun Prakash', phone: '9876543222', designation: 'Packer', department: 'Warehouse', salary: 15000, joinDate: new Date('2024-06-01') },
    { employeeId: 'EMP-0004', name: 'Divya Sri', phone: '9876543223', designation: 'Sales Rep', department: 'Sales', salary: 20000, joinDate: new Date('2024-02-15') },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { employeeId: emp.employeeId },
      update: {},
      create: emp,
    });
  }
  console.log('✅ Sample employees created');

  // ─── Sample Suppliers ──────────────────────────────
  const suppliers = [
    { name: 'Wax Industries Pvt Ltd', contactName: 'Venkat Rao', phone: '9876543230', email: 'sales@waxindustries.in', gstNumber: '33AABCT1234A1ZA', state: 'Tamil Nadu' },
    { name: 'Fragrance World', contactName: 'Deepak Jain', phone: '9876543231', email: 'info@fragranceworld.com', gstNumber: '29AABCT5678B1ZB', state: 'Karnataka' },
    { name: 'Glass Containers Co', contactName: 'Sundar M', phone: '9876543232', email: 'orders@glassco.in', state: 'Tamil Nadu' },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.create({ data: supplier }).catch(() => {});
  }
  console.log('✅ Sample suppliers created');

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
