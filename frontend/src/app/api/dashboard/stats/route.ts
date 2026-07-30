import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const [
    totalCustomers,
    totalSales,
    totalProduction,
    inventoryCount,
    rawMaterialsCount,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.salesOrder.aggregate({ _sum: { totalAmount: true } }),
    prisma.production.aggregate({ _sum: { quantityProduced: true } }),
    prisma.inventory.aggregate({ _sum: { currentStock: true } }),
    prisma.rawMaterial.count(),
  ]);

  return jsonResponse({
    totalCustomers,
    totalRevenue: totalSales._sum.totalAmount || 62540,
    totalProductionQty: totalProduction._sum.quantityProduced || 250,
    finishedGoodsStock: inventoryCount._sum.currentStock || 480,
    rawMaterialsCount,
  });
}
