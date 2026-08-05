import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { NotificationService } from '@/lib/services/NotificationService';

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
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.orderDate = {};
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        where.orderDate.gte = new Date(d.setHours(0, 0, 0, 0));
      }
    }
    if (endDate) {
      const d = new Date(endDate);
      if (!isNaN(d.getTime())) {
        where.orderDate.lte = new Date(d.setHours(23, 59, 59, 999));
      }
    }
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

    const { customerId, items, paymentMethod, notes, discount = 0, transportCharge = 0, orderDate, deliveryDate, status } = body;

    let subtotal = 0;
    const orderItemsData: any[] = [];
    const batchUpdates: any[] = [];

    // Fetch available batches ordered by oldest first (Strict FIFO)
    const availableBatches = await prisma.batch.findMany({
      where: {
        status: { in: ['IN_PRODUCTION', 'COMPLETED', 'PARTIALLY_SOLD'] },
        remainingQty: { gt: 0 }
      },
      orderBy: { createdAt: 'asc' }
    });

    for (const item of items) {
      let requiredQty = Number(item.quantity);
      // Allow batches with matching productId or legacy batches with null productId
      const productBatches = availableBatches.filter(b => 
        (b.productId === item.productId || b.productId === null) && b.remainingQty > 0
      );
      
      const itemDiscount = Number(item.discount || 0);
      const discountPerKg = itemDiscount / (requiredQty || 1);
      
      if (productBatches.length === 0 && requiredQty > 0) {
        throw new Error(`Insufficient stock in batches for product ID ${item.productId}`);
      }

      for (const batch of productBatches) {
        if (requiredQty <= 0) break;
        
        const takeQty = Math.min(requiredQty, batch.remainingQty);
        requiredQty -= takeQty;
        batch.remainingQty -= takeQty;
        batch.soldQty += takeQty;
        
        let newStatus = batch.status;
        if (batch.remainingQty <= 0) {
           newStatus = 'FULLY_SOLD';
        } else if (batch.soldQty > 0) {
           newStatus = 'PARTIALLY_SOLD';
        }

        batchUpdates.push({
          id: batch.id,
          soldQty: batch.soldQty,
          remainingQty: batch.remainingQty,
          status: newStatus
        });

        const splitDiscount = discountPerKg * takeQty;
        const itemSubtotal = (takeQty * Number(item.unitPrice)) - splitDiscount;
        subtotal += itemSubtotal;
        
        const gstRate = Number(item.gstRate || 18);
        const gstAmount = (itemSubtotal * gstRate) / 100;
        
        orderItemsData.push({
          productId: item.productId,
          batchId: batch.id,
          quantity: takeQty,
          unitPrice: Number(item.unitPrice),
          discount: splitDiscount,
          gstRate,
          gstAmount,
          amount: itemSubtotal + gstAmount,
        });
      }

      if (requiredQty > 0) {
         throw new Error(`Insufficient stock in batches for product ID ${item.productId}. Short by ${requiredQty} KG.`);
      }
    }

    const totalGst = orderItemsData.reduce((acc: number, cur: any) => acc + cur.gstAmount, 0);
    const totalAmount = subtotal + totalGst + Number(transportCharge) - Number(discount);

    // Use a transaction to create the order and update batches atomically
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create Sales Order
      const newOrder = await tx.salesOrder.create({
        data: {
          orderNumber,
          customerId,
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
          status: status || 'PENDING',
          subtotal,
          totalGst,
          cgst: totalGst / 2,
          sgst: totalGst / 2,
          discount: Number(discount),
          transportCharge: Number(transportCharge),
          totalAmount,
          outstanding: totalAmount,
          paymentMethod: paymentMethod || 'CREDIT',
          notes: notes ? JSON.stringify(notes) : undefined,
          createdBy: user.id,
          items: {
            create: orderItemsData,
          },
        },
        include: { customer: true, items: true },
      });

      // 2. Update Batches
      for (const update of batchUpdates) {
        await tx.batch.update({
          where: { id: update.id },
          data: {
            soldQty: update.soldQty,
            remainingQty: update.remainingQty,
            status: update.status
          }
        });
      }

      return newOrder;
    });

    // Fire Notification asynchronously
    NotificationService.broadcastToRole('ADMIN', {
      module: 'SALES',
      category: 'ORDER_CREATED',
      title: 'New Sales Order',
      message: `Order ${order.orderNumber} created for ${order.customer.name} (Amount: ₹${order.totalAmount})`,
      referenceType: 'SalesOrder',
      referenceId: order.id,
      link: `/dashboard/sales`,
      icon: 'shopping-cart',
      color: 'blue',
      createdById: user.id,
    }).catch(console.error);

    return jsonResponse(order, 201, 'Sales Order created successfully');
  } catch (err: any) {
    console.error('Sales Order Error:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
    const msg = err?.meta?.cause || err?.meta?.target || err?.message || 'Failed to create sales order';
    return errorResponse(msg, 400, { detail: err.message, code: err.code });
  }
}
