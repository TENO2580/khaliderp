import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const routesData = await prisma.customer.groupBy({
      by: ['route'],
      where: {
        route: {
          not: null,
          notIn: ['']
        }
      },
      _count: {
        id: true
      },
      _sum: {
        outstanding: true
      }
    });

    const formattedData = routesData.map(r => ({
      name: r.route,
      shopCount: r._count.id,
      totalOutstanding: r._sum.outstanding || 0
    }));

    formattedData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return jsonResponse(formattedData, 200, 'Routes fetched successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch routes', 500);
  }
}
