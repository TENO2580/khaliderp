import { NextRequest } from 'next/server';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_CATEGORIES = [
  { name: 'PARAFFIN WAX', icon: 'Flame', color: '#f59e0b' },
  { name: 'WAX', icon: 'Package', color: '#3b82f6' },
  { name: 'TRAVELLING', icon: 'Truck', color: '#10b981' },
  { name: 'ADVERTISING', icon: 'Megaphone', color: '#8b5cf6' },
  { name: 'SALARY', icon: 'UserCheck', color: '#06b6d4' },
  { name: 'ELECTRICITY', icon: 'Zap', color: '#eab308' },
  { name: 'MAINTENANCE', icon: 'Wrench', color: '#ec4899' },
  { name: 'RENT', icon: 'Home', color: '#6366f1' },
  { name: 'OFFICE & MISC', icon: 'Receipt', color: '#64748b' },
];

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    let categories = await prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    if (categories.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await prisma.expenseCategory.upsert({
          where: { name: cat.name },
          update: {},
          create: { name: cat.name, icon: cat.icon, color: cat.color, isActive: true },
        });
      }
      categories = await prisma.expenseCategory.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    }

    return jsonResponse(categories);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch categories', 500);
  }
}
