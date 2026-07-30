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

  const skip = (page - 1) * limit;
  const where: any = {};

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    }),
    prisma.salesOrder.count({ where }),
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
    const count = await prisma.salesOrder.count();
    const orderNumber = `SO-2026-${String(count + 1).padStart(4, '0')}`;

    const { customerId, items, paymentMethod, notes, discount = 0, transportCharge = 0 } = body;

    let subtotal = 0;
    const orderItemsData = items.map((item: any) => {
      const itemSubtotal = item.quantity * item.unitPrice - (item.discount || 0);
      subtotal += itemSubtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        subtotal: itemSubtotal,
        gstRate: item.gstRate || 18,
        gstAmount: (itemSubtotal * (item.gstRate || 18)) / 100,
        totalAmount: itemSubtotal + (itemSubtotal * (item.gstRate || 18)) / 100,
      };
    });

    const totalGst = orderItemsData.reduce((acc: number, cur: any) => acc + cur.gstAmount, 0);
    const totalAmount = subtotal + totalGst + transportCharge - discount;

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId,
        orderDate: new Date(),
        subtotal,
        totalGst,
        cgst: totalGst / 2,
        sgst: totalGst / 2,
        discount,
        transportCharge,
        totalAmount,
        outstanding: totalAmount,
        paymentMethod: paymentMethod || 'CREDIT',
        notes,
        createdBy: user.id,
        items: {
          create: orderItemsData,
        },
      },
      include: { customer: true, items: true },
    });

    return jsonResponse(order, 201, 'Sales Order created');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create sales order', 400);
  }
}
