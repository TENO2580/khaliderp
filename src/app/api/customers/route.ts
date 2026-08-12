import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

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
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { ownerName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { customerId: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }
  
  const route = url.searchParams.get('route') || '';
  if (route) {
    where.route = route;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        where.createdAt.gte = new Date(d.setHours(0, 0, 0, 0));
      }
    }
    if (endDate) {
      const d = new Date(endDate);
      if (!isNaN(d.getTime())) {
        where.createdAt.lte = new Date(d.setHours(23, 59, 59, 999));
      }
    }
  }

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        customerId: true,
        name: true,
        ownerName: true,
        phone: true,
        district: true,
        state: true,
        address: true,
        route: true,
        lastPurchaseDate: true,
        nextFollowupDate: true,
        status: true,
        notes: true,
        sellingPrice: true,
        type: true,
      }
    }),
    prisma.customer.count({ where }),
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

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const count = await prisma.customer.count();
    const customerId = `CUST-${String(count + 1).padStart(4, '0')}`;

    if (body.lastPurchaseDate) {
      body.lastPurchaseDate = new Date(body.lastPurchaseDate).toISOString();
    } else {
      body.lastPurchaseDate = null;
    }

    if (body.nextFollowupDate) {
      body.nextFollowupDate = new Date(body.nextFollowupDate).toISOString();
    } else {
      body.nextFollowupDate = null;
    }

    const customer = await prisma.customer.create({
      data: {
        ...body,
        customerId,
      },
    });

    return jsonResponse(customer, 201, 'Customer created successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create customer', 400);
  }
}
