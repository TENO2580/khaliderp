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
      orderBy: { customerId: 'desc' },
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
    // Fetch all customer IDs to find the true maximum numeric value
    const allCustomers = await prisma.customer.findMany({
      select: { customerId: true }
    });

    let maxId = 0;
    for (const cust of allCustomers) {
      if (cust.customerId) {
        // Only match standard CUST-XXXX format
        const match = cust.customerId.match(/^CUST-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxId) maxId = num;
        }
      }
    }

    const nextIdNum = maxId > 0 ? maxId + 1 : (await prisma.customer.count()) + 1;
    const customerId = `CUST-${String(nextIdNum).padStart(4, '0')}`;
      ['sellingPrice', 'creditLimit', 'outstanding', 'latitude', 'longitude'].forEach(field => { 
        if (body[field] !== undefined && body[field] !== null && body[field] !== '') body[field] = parseFloat(body[field]); 
        else if (body[field] === '') body[field] = null; 
      });


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

export async function DELETE(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');
    let idsToDelete: string[] = [];
    
    if (idsParam) {
      idsToDelete = idsParam.split(',').filter(Boolean);
    } else {
      const body = await req.json();
      idsToDelete = Array.isArray(body.ids) ? body.ids : [];
    }

    if (idsToDelete.length === 0) {
      return errorResponse('No IDs provided for deletion', 400);
    }

    const result = await prisma.customer.deleteMany({
      where: {
        id: { in: idsToDelete }
      }
    });

    return jsonResponse({
      message: `Successfully deleted ${result.count} customers`,
      count: result.count
    });
  } catch (err: any) {
    console.error('Error deleting customers:', err);
    return errorResponse(err.message, 500);
  }
}
