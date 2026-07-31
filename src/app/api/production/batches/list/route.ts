import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const search = url.searchParams.get('search') || '';
  const startDate = url.searchParams.get('startDate') || '';
  const endDate = url.searchParams.get('endDate') || '';
  const status = url.searchParams.get('status') || '';

  const skip = (page - 1) * limit;
  const where: any = {};

  if (search) {
    where.batchNumber = { contains: search, mode: 'insensitive' };
  }
  
  if (status) {
    where.status = status;
  }
  
  if (startDate || endDate) {
    where.productionDate = {};
    if (startDate) where.productionDate.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.productionDate.lte = end;
    }
  }

  const [data, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      orderBy: { productionDate: 'desc' },
      skip,
      take: limit,
      include: { product: true },
    }),
    prisma.batch.count({ where }),
  ]);

  return jsonResponse({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}
