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
      orderBy: [
        { batchNumber: 'asc' },
        { purchaseDate: 'asc' },
        { createdAt: 'asc' },
      ],
      skip,
      take: limit,
      select: {
        id: true,
        batchNumber: true,
        purchaseDate: true,
        waxInitialQty: true,
        waxRate: true,
        waxStock: true,
        productionCost: true,
        sellingPrice: true,
        producedQty: true,
        soldQty: true,
        remainingQty: true,
        status: true,
        product: { select: { name: true } },
        salesOrderItems: {
          select: {
            order: { select: { orderNumber: true } }
          }
        }
      },
    }),
    prisma.batch.count({ where }),
  ]);

  // Derive order numbers from actual SalesOrderItem relationships
  const dataWithOrders = data.map((b: any) => {
    const orderNumbers = b.salesOrderItems
      .map((item: any) => item.order.orderNumber);
    // Deduplicate order numbers
    const uniqueOrders = [...new Set(orderNumbers)] as string[];
    return {
      ...b,
      salesOrderItems: undefined, // Remove raw relation data
      fifoOrders: uniqueOrders.length > 0 ? uniqueOrders.join(', ') : '-'
    };
  });

  return jsonResponse({
    data: dataWithOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}
