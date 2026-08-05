import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    
    const { 
      orderDate, 
      deliveryDate, 
      status, 
      totalAmount, 
      outstanding, 
      notes,
      quantity, // this is for the first item
    } = body;

    let parsedOrderDate = undefined;
    if (orderDate) parsedOrderDate = new Date(orderDate).toISOString();
    
    let parsedDeliveryDate = undefined;
    if (deliveryDate) parsedDeliveryDate = new Date(deliveryDate).toISOString();
    else if (deliveryDate === '') parsedDeliveryDate = null;

    const result = await prisma.$transaction(async (tx) => {
      // First update the order
      const order = await tx.salesOrder.update({
        where: { id },
        data: {
          ...(parsedOrderDate !== undefined && { orderDate: parsedOrderDate }),
          ...(parsedDeliveryDate !== undefined && { deliveryDate: parsedDeliveryDate }),
          ...(status && { status }),
          ...(totalAmount !== undefined && { totalAmount: Number(totalAmount) }),
          ...(outstanding !== undefined && { outstanding: Number(outstanding) }),
          ...(notes && { notes: JSON.stringify(notes) }),
        },
        include: { items: true }
      });

      // If quantity is provided, update the first item
      if (quantity !== undefined && order.items && order.items.length > 0) {
        await tx.salesOrderItem.update({
          where: { id: order.items[0].id },
          data: { quantity: Number(quantity) }
        });
        order.items = await tx.salesOrderItem.findMany({ where: { orderId: order.id } });
      }

      // (FIFO Allocation Engine removed - allocation now happens immediately in POST route)

      // Auto-generate invoice if DELIVERED
      if (status === 'DELIVERED') {
        await tx.invoice.upsert({
          where: { orderId: order.id },
          update: {
            subtotal: order.subtotal,
            cgst: order.cgst,
            sgst: order.sgst,
            igst: order.igst,
            totalGst: order.totalGst,
            transportCharge: order.transportCharge,
            totalAmount: order.totalAmount,
            outstanding: order.outstanding,
            paidAmount: order.paidAmount,
          },
          create: {
            invoiceNumber: `INV-${order.orderNumber}`,
            orderId: order.id,
            customerId: order.customerId,
            subtotal: order.subtotal,
            cgst: order.cgst,
            sgst: order.sgst,
            igst: order.igst,
            totalGst: order.totalGst,
            transportCharge: order.transportCharge,
            totalAmount: order.totalAmount,
            outstanding: order.outstanding,
            paidAmount: order.paidAmount,
            status: 'ISSUED',
          }
        });
      }
      return order;
    });

    return jsonResponse(result, 200, 'Sales order updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update sales order', 400);
  }
}
