import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const [totalAgg, countResult] = await Promise.all([
      prisma.expense.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      }),
      prisma.expense.count(),
    ]);

    return jsonResponse({
      total: totalAgg._sum.amount || 0,
      average: Math.round(totalAgg._avg.amount || 0),
      count: countResult,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch expense stats', 500);
  }
}
