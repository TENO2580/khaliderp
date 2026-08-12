import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/middleware-server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const categories = await prisma.expenseCategory.findMany();
  return jsonResponse({ data: categories });
}
