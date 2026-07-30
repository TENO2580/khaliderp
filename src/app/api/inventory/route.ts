import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '100');

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.inventory.findMany({
      orderBy: { lastUpdated: 'desc' },
      skip,
      take: limit,
      include: { product: true },
    }),
    prisma.inventory.count(),
  ]);

  return jsonResponse({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
