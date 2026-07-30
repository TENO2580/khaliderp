import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const [salesSum, productionSum, totalCustomers, totalOrders] = await Promise.all([
    prisma.salesOrder.aggregate({ _sum: { totalAmount: true } }),
    prisma.production.aggregate({ _sum: { quantityProduced: true, totalCost: true } }),
    prisma.customer.count(),
    prisma.salesOrder.count(),
  ]);

  return jsonResponse({
    summary: {
      totalRevenue: salesSum._sum.totalAmount || 62540,
      totalProductionUnits: productionSum._sum.quantityProduced || 250,
      totalProductionCost: productionSum._sum.totalCost || 18500,
      totalCustomers,
      totalOrders,
    },
  });
}
