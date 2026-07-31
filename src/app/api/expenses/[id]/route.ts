import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { categoryId, amount, date, description, status } = body;

    const updateData: any = {};
    if (categoryId) updateData.categoryId = categoryId;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (date) updateData.date = new Date(date);
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    return jsonResponse(expense, 200, 'Expense updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update expense', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    await prisma.expense.delete({ where: { id } });
    return jsonResponse(null, 200, 'Expense deleted');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete expense', 400);
  }
}
