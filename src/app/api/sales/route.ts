import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { NotificationService } from '@/lib/services/NotificationService';

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
      select: {
        id: true,
        orderNumber: true,
        customerId: true,
        orderDate: true,
        deliveryDate: true,
        totalAmount: true,
        paidAmount: true,
        paymentMethod: true,
        outstanding: true,
        status: true,
        notes: true,
        customer: { select: { name: true, phone: true } },
        items: {
          select: {
            productId: true,
            quantity: true,
            unitPrice: true,
            gstRate: true,
            batchId: true,
            product: { select: { name: true } },
            batch: { select: { batchNumber: true } }
          }
        }
      },
    }),
    prisma.salesOrder.count({ where }),
  ]);

  // Derive batch names from actual SalesOrderItem.batchId relationships
  const dataWithBatches = data.map((order: any) => {
    const batchNames = order.items
      .filter((item: any) => item.batch)
      .map((item: any) => item.batch.batchNumber);
    // Deduplicate batch names while preserving order
    const uniqueBatches = [...new Set(batchNames)] as string[];
    return {
      ...order,
      fifoBatches: uniqueBatches.length > 0 ? uniqueBatches.join(', ') : '-'
    };
  });

  return jsonResponse({
    data: dataWithBatches,
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
    const lastOrder = await prisma.salesOrder.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    let nextNum = 1;
    if (lastOrder?.orderNumber) {
      const match = lastOrder.orderNumber.match(/(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const orderNumber = `SO-2026-${String(nextNum).padStart(4, '0')}`;

    const { customerId, items, paymentMethod, notes, discount = 0, transportCharge = 0, orderDate, deliveryDate, status, paidAmount } = body;

    let subtotal = 0;
    const orderItemsData: any[] = [];
    const batchUpdates: any[] = [];

    // Fetch available batches ordered by oldest first (Strict FIFO based on purchaseDate)
    const availableBatches = await prisma.batch.findMany({
      where: {
        remainingQty: { gt: 0 }
      },
      orderBy: { purchaseDate: 'asc' }
    });

    // Fallback product if frontend doesn't provide one
    const defaultProduct = await prisma.product.findFirst();

    for (const item of items) {
      if (!item.productId && defaultProduct) {
        item.productId = defaultProduct.id;
      }
      
      let requiredUnits = Number(item.quantity);
      const weightPerUnit = Number(notes?.weightPerUnit) > 0 ? Number(notes.weightPerUnit) : 1;
      let requiredKg = requiredUnits * weightPerUnit;
      
      // Allow batches with matching productId or legacy batches with null productId
      let productBatches = availableBatches.filter(b => 
        (b.productId === item.productId || b.productId === null) && b.remainingQty > 0
      );

      // If frontend specified a batchId, strictly pull from that batch
      if (item.batchId) {
        productBatches = productBatches.filter(b => b.id === item.batchId);
      }
      
      const itemDiscount = Number(item.discount || 0);
      const discountPerUnit = itemDiscount / (requiredUnits || 1);
      
      if (productBatches.length === 0 && requiredKg > 0) {
        throw new Error(`Insufficient stock in batches for product ID ${item.productId}`);
      }

      for (const batch of productBatches) {
        if (requiredKg <= 0) break;
        
        const takeKg = Math.min(requiredKg, batch.remainingQty);
        const takeUnits = Number((takeKg / weightPerUnit).toFixed(4));
        
        requiredKg -= takeKg;
        requiredUnits -= takeUnits;
        
        batch.remainingQty -= takeKg;
        batch.soldQty += takeKg;
        
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

        const splitDiscount = discountPerUnit * takeUnits;
        const itemSubtotal = (takeUnits * Number(item.unitPrice)) - splitDiscount;
        subtotal += itemSubtotal;
        
        const gstRate = Number(item.gstRate || 18);
        const gstAmount = (itemSubtotal * gstRate) / 100;
        
        orderItemsData.push({
          productId: item.productId,
          batchId: batch.id,
          quantity: takeUnits,
          unitPrice: Number(item.unitPrice),
          discount: splitDiscount,
          gstRate,
          gstAmount,
          amount: itemSubtotal + gstAmount,
        });
      }

      if (requiredKg > 0.001) { // Floating point precision check
         throw new Error(`Insufficient stock in batches for product ID ${item.productId}. Short by ${requiredKg.toFixed(2)} KG.`);
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
          paidAmount: paymentMethod === 'CREDIT' ? Number(paidAmount || 0) : totalAmount,
          creditAmount: paymentMethod === 'CREDIT' ? totalAmount - Number(paidAmount || 0) : 0,
          outstanding: paymentMethod === 'CREDIT' ? totalAmount - Number(paidAmount || 0) : 0,
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
    }, { maxWait: 5000, timeout: 20000 });

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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch all items for these orders to revert batch quantities
      const itemsToRevert = await tx.salesOrderItem.findMany({
        where: { orderId: { in: idsToDelete }, batchId: { not: null } },
        select: { batchId: true, quantity: true }
      });

      // 2. Aggregate quantities to revert per batch
      const batchReversions: Record<string, number> = {};
      for (const item of itemsToRevert) {
        if (item.batchId) {
          batchReversions[item.batchId] = (batchReversions[item.batchId] || 0) + item.quantity;
        }
      }

      // 3. Update batches
      for (const [batchId, qty] of Object.entries(batchReversions)) {
        await tx.batch.update({
          where: { id: batchId },
          data: {
            soldQty: { decrement: qty },
            remainingQty: { increment: qty },
            status: 'PARTIALLY_SOLD'
          }
        });
      }

      // 4. Delete associated invoices (if any)
      const invoices = await tx.invoice.findMany({
        where: { orderId: { in: idsToDelete } },
        select: { id: true }
      });
      const invoiceIds = invoices.map(i => i.id);

      if (invoiceIds.length > 0) {
        // Delete payments
        await tx.payment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        // Delete invoice items
        await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        // Delete invoices
        await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
      }

      // 5. Delete SalesOrders (SalesOrderItems will be cascade deleted)
      const deleteResult = await tx.salesOrder.deleteMany({
        where: { id: { in: idsToDelete } }
      });

      return deleteResult;
    }, { maxWait: 5000, timeout: 20000 });

    return jsonResponse({
      message: `Successfully deleted ${result.count} sales orders`,
      count: result.count
    });
  } catch (err: any) {
    console.error('Error deleting sales orders:', err);
    return errorResponse(err.message, 500);
  }
}
