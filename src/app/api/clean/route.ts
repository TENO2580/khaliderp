import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await prisma.inventory.deleteMany();
    await prisma.product.deleteMany();
    await prisma.rawMaterial.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.expenseCategory.deleteMany();
    
    return NextResponse.json({ message: 'Dummy data deleted successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
