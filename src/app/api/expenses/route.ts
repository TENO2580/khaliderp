import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const startDate = url.searchParams.get('startDate') || '';
  const endDate = url.searchParams.get('endDate') || '';
  const status = url.searchParams.get('status') || '';

  const where: any = {};
  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { category: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        where.date.gte = new Date(d.setHours(0, 0, 0, 0));
      }
    }
    if (endDate) {
      const d = new Date(endDate);
      if (!isNaN(d.getTime())) {
        where.date.lte = new Date(d.setHours(23, 59, 59, 999));
      }
    }
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { category: true, createdBy: true },
  });

  return jsonResponse({ data: expenses });
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { categoryId, amount, date, description } = body;

    const expense = await prisma.expense.create({
      data: {
        categoryId,
        amount: Number(amount),
        date: new Date(date || Date.now()),
        description,
        createdById: user.id,
      },
      include: { category: true },
    });

    return jsonResponse(expense, 201, 'Expense logged successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to log expense', 400);
  }
}
