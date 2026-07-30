import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const batches = await prisma.batch.findMany({
    orderBy: { productionDate: 'desc' },
    take: 100,
    include: { product: true },
  });

  return jsonResponse({ data: batches });
}
