import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';

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

  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const skip = (page - 1) * limit;

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        amount: true,
        date: true,
        description: true,
        status: true,
        receiptUrl: true,
        category: { select: { id: true, name: true, color: true, icon: true } },
        createdBy: { select: { id: true, name: true } },
      },
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return jsonResponse({
    data: expenses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    let { categoryId, categoryName, amount, date, description } = body;

    if (!categoryId && categoryName) {
      const cleanName = categoryName.trim().toUpperCase();
      const cat = await prisma.expenseCategory.upsert({
        where: { name: cleanName },
        update: { isActive: true },
        create: { name: cleanName, icon: 'Receipt', color: '#3b82f6', isActive: true },
      });
      categoryId = cat.id;
    }

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
