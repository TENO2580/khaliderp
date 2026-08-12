import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';


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
    where.purchaseDate = {};
    if (startDate) where.purchaseDate.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.purchaseDate.lte = end;
    }
  }

  const [data, total] = await Promise.all([
    prisma.batch.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        batchNumber: true,
        purchaseDate: true,
        waxInitialQty: true,
        waxRate: true,
        productionCost: true,
        sellingPrice: true,
        producedQty: true,
        soldQty: true,
        remainingQty: true,
        status: true,
        product: { select: { name: true } }
      },
    }),
    prisma.batch.count({ where }),
  ]);

  return jsonResponse({
    data: data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}
