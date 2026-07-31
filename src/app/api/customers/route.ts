import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const search = url.searchParams.get('search') || '';
  const date = url.searchParams.get('date') || '';
  const month = url.searchParams.get('month') || '';
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

  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      where.createdAt = {
        gte: new Date(d.setHours(0, 0, 0, 0)),
        lt: new Date(d.setHours(23, 59, 59, 999)),
      };
    }
  } else if (month) {
    const [y, m] = month.split('-');
    if (y && m) {
      const start = new Date(parseInt(y), parseInt(m) - 1, 1);
      const end = new Date(parseInt(y), parseInt(m), 1);
      where.createdAt = {
        gte: start,
        lt: end,
      };
    }
  }

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
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
