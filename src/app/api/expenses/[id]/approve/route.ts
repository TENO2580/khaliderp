import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: user.id,
      },
      include: { category: true },
    });

    return jsonResponse(expense, 200, 'Expense approved');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to approve expense', 400);
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return PATCH(req, { params });
}
