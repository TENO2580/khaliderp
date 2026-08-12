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
      // Fetch the existing order BEFORE updating it, to check status change
      const existingOrder = await tx.salesOrder.findUnique({
        where: { id },
        include: { items: true }
      });
      if (!existingOrder) throw new Error("Order not found");

      const isNewlyCancelled = status === 'CANCELLED' && existingOrder.status !== 'CANCELLED';
      
      let finalItems = existingOrder.items;

      // Handle Cancelled status
      if (isNewlyCancelled) {
        // Revert all wax to batches
        for (const item of existingOrder.items) {
          if (!item.batchId) continue;
          const batch = await tx.batch.findUnique({ where: { id: item.batchId } });
          if (batch) {
             await tx.batch.update({
               where: { id: batch.id },
               data: {
                 remainingQty: batch.remainingQty + item.quantity,
                 soldQty: Math.max(0, batch.soldQty - item.quantity),
                 status: batch.status === 'FULLY_SOLD' ? 'PARTIALLY_SOLD' : batch.status
               }
             });
          }
        }
      } 
      // If quantity changes, re-allocate using FIFO
      else if (quantity !== undefined && status !== 'CANCELLED') {
        const oldTotalQty = existingOrder.items.reduce((acc, item) => acc + item.quantity, 0);
        let newQty = Number(quantity);

        if (newQty !== oldTotalQty && existingOrder.items.length > 0) {
          // 1. Revert all existing allocations
          for (const item of existingOrder.items) {
            if (!item.batchId) continue;
            const batch = await tx.batch.findUnique({ where: { id: item.batchId } });
            if (batch) {
               await tx.batch.update({
                 where: { id: batch.id },
                 data: {
                   remainingQty: batch.remainingQty + item.quantity,
                   soldQty: Math.max(0, batch.soldQty - item.quantity),
                   status: batch.status === 'FULLY_SOLD' ? 'PARTIALLY_SOLD' : batch.status
                 }
               });
            }
          }

          // 2. Delete old items
          await tx.salesOrderItem.deleteMany({ where: { orderId: id } });

          // 3. Re-allocate using strict FIFO
          const productId = existingOrder.items[0].productId;
          let requiredQty = newQty;
          
          const availableBatches = await tx.batch.findMany({
            where: { remainingQty: { gt: 0 } },
            orderBy: { purchaseDate: 'asc' }
          });

          let productBatches = availableBatches.filter(b => 
            (b.productId === productId || b.productId === null) && b.remainingQty > 0
          );

          if (productBatches.length === 0 && requiredQty > 0) {
            throw new Error(`Insufficient stock in batches for product ID ${productId}`);
          }

          const unitPrice = existingOrder.items[0].unitPrice;
          const gstRate = existingOrder.items[0].gstRate;

          for (const batch of productBatches) {
            if (requiredQty <= 0) break;
            
            const takeQty = Math.min(requiredQty, batch.remainingQty);
            requiredQty -= takeQty;
            
            await tx.batch.update({
              where: { id: batch.id },
              data: {
                remainingQty: batch.remainingQty - takeQty,
                soldQty: batch.soldQty + takeQty,
                status: (batch.remainingQty - takeQty <= 0) ? 'FULLY_SOLD' : 'PARTIALLY_SOLD'
              }
            });

            const itemSubtotal = takeQty * Number(unitPrice);
            const gstAmount = (itemSubtotal * Number(gstRate)) / 100;

            await tx.salesOrderItem.create({
              data: {
                orderId: id,
                productId,
                batchId: batch.id,
                quantity: takeQty,
                unitPrice: Number(unitPrice),
                discount: 0, // Keep simple for edit re-allocation
                gstRate: Number(gstRate),
                gstAmount,
                amount: itemSubtotal + gstAmount
              }
            });
          }

          if (requiredQty > 0) {
            throw new Error(`Insufficient stock in batches. Short by ${requiredQty} KG`);
          }

          finalItems = await tx.salesOrderItem.findMany({ where: { orderId: id } });
        }
      }

      // Update the order itself
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
      order.items = finalItems;

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
    }, { maxWait: 5000, timeout: 20000 });

    return jsonResponse(result, 200, 'Sales order updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update sales order', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    
    await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.salesOrder.findUnique({
        where: { id },
        include: { items: true }
      });
      if (!existingOrder) throw new Error("Order not found");

      // Revert batch quantities if not already cancelled
      if (existingOrder.status !== 'CANCELLED') {
        for (const item of existingOrder.items) {
          if (!item.batchId) continue;
          const batch = await tx.batch.findUnique({ where: { id: item.batchId } });
          if (batch) {
             await tx.batch.update({
               where: { id: batch.id },
               data: {
                 remainingQty: batch.remainingQty + item.quantity,
                 soldQty: Math.max(0, batch.soldQty - item.quantity),
                 status: batch.status === 'FULLY_SOLD' ? 'PARTIALLY_SOLD' : batch.status
               }
             });
          }
        }
      }

      // Manually delete related Invoice and its Payments to prevent foreign key constraint violations
      const invoice = await tx.invoice.findUnique({ where: { orderId: id } });
      if (invoice) {
        await tx.payment.deleteMany({ where: { invoiceId: invoice.id } });
        await tx.invoice.delete({ where: { id: invoice.id } });
      }

      await tx.salesOrder.delete({
        where: { id }
      });
    });

    return jsonResponse(null, 200, 'Sales order deleted successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete sales order', 400);
  }
}
