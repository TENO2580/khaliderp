import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/middleware-server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  const categories = await prisma.expenseCategory.findMany();
  return jsonResponse({ data: categories });
}
