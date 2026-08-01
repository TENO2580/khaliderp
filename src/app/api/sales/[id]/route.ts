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

      // FIFO Allocation Engine
      if (status === 'DELIVERED') {
        for (const item of order.items) {
          if (item.batchId) continue; // Already allocated

          let qtyToAllocate = item.quantity;
          const originalQty = item.quantity;

          // Find active batches
          const allBatches = await tx.batch.findMany({
            orderBy: { productionDate: 'asc' },
            include: { salesOrderItems: { where: { order: { status: 'DELIVERED' } } } }
          });

          const batchesWithRemaining = allBatches.map(b => {
            const sold = b.salesOrderItems.reduce((acc, curr) => acc + curr.quantity, 0);
            return { ...b, remainingQty: b.producedQty - sold };
          }).filter(b => b.remainingQty > 0);

          let firstAllocation = true;

          for (const batch of batchesWithRemaining) {
            if (qtyToAllocate <= 0) break;

            const allocatedQty = Math.min(qtyToAllocate, batch.remainingQty);
            const ratio = allocatedQty / originalQty;

            const splitDiscount = Number(((item.discount || 0) * ratio).toFixed(2));
            const splitAmount = Number(((allocatedQty * item.unitPrice) - splitDiscount).toFixed(2));
            const splitGst = Number((splitAmount * (item.gstRate / 100)).toFixed(2));

            if (firstAllocation) {
              await tx.salesOrderItem.update({
                where: { id: item.id },
                data: {
                  batchId: batch.id,
                  quantity: allocatedQty,
                  discount: splitDiscount,
                  amount: splitAmount,
                  gstAmount: splitGst,
                }
              });
              firstAllocation = false;
            } else {
              await tx.salesOrderItem.create({
                data: {
                  orderId: order.id,
                  productId: item.productId,
                  batchId: batch.id,
                  quantity: allocatedQty,
                  unitPrice: item.unitPrice,
                  discount: splitDiscount,
                  gstRate: item.gstRate,
                  gstAmount: splitGst,
                  amount: splitAmount,
                }
              });
            }

            qtyToAllocate -= allocatedQty;
          }
          
          if (qtyToAllocate > 0) {
             throw new Error(`Not enough inventory to fulfill ${qtyToAllocate} KG of product.`);
          }
        }
      }

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
