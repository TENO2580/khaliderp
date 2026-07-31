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

  const skip = (page - 1) * limit;
  const where: any = {};

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: 'desc' },
      skip,
      take: limit,
      include: { 
        order: {
          include: { items: { include: { product: true } } }
        },
        customer: true 
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  // Format data for the frontend table
  const formattedData = data.map((inv: any) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    orderNumber: inv.order?.orderNumber,
    customerName: inv.customer?.name,
    invoiceDate: inv.invoiceDate,
    gstAmount: inv.totalGst,
    totalAmount: inv.totalAmount,
    status: inv.status,
    customer: inv.customer,
    order: inv.order,
  }));

  return jsonResponse({
    data: formattedData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}
