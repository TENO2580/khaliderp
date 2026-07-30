import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const expenses = await prisma.expense.findMany({
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
