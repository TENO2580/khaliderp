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
      include: { 
        product: true,
        salesOrderItems: {
          where: { order: { status: 'DELIVERED' } }
        }
      },
    }),
    prisma.batch.count({ where }),
  ]);

  const processed = data.map(b => {
    const soldQty = b.salesOrderItems.reduce((acc, item) => acc + item.quantity, 0);
    const remainingQty = Math.max(0, b.producedQty - soldQty);
    let status = 'IN_PRODUCTION';
    if (b.producedQty > 0 && remainingQty === 0) status = 'COMPLETED';
    
    const { salesOrderItems, ...rest } = b;
    return { ...rest, soldQty, remainingQty, status };
  });

  return jsonResponse({
    data: processed,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}
