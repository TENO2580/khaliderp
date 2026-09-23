import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch Sales Orders that have outstanding > 0
    const salesOrders = await prisma.salesOrder.findMany({
      where: {
        outstanding: { gt: 0 },
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          }
        },
      }
    });

    // Fetch Purchase Orders that have outstanding > 0
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        outstanding: { gt: 0 },
      },
      include: {
        supplier: {
          select: {
            name: true,
            phone: true,
          }
        },
      }
    });

    let allOverdue: any[] = [];

    // Map Sales Orders (Receivables)
    salesOrders.forEach(order => {
      // Use deliveryDate if available, otherwise orderDate + 30 days as a fallback
      const due = order.deliveryDate ? new Date(order.deliveryDate) : new Date(new Date(order.orderDate).setDate(new Date(order.orderDate).getDate() + 30));
      
      let daysOverdue = 0;
      if (today > due) {
        const diffTime = Math.abs(today.getTime() - due.getTime());
        daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      if (daysOverdue > 0 || order.outstanding > 0) {
        allOverdue.push({
          id: order.id,
          type: 'RECEIVABLE',
          referenceNumber: order.orderNumber,
          entityName: order.customer?.name || 'Unknown',
          entityPhone: order.customer?.phone,
          date: order.orderDate,
          dueDate: due,
          totalAmount: order.totalAmount,
          paidAmount: order.paidAmount,
          outstanding: order.outstanding,
          daysOverdue,
        });
      }
    });

    // Map Purchase Orders (Payables)
    purchaseOrders.forEach(po => {
      // Use expectedDate if available, otherwise orderDate + 30 days as a fallback
      const due = po.expectedDate ? new Date(po.expectedDate) : new Date(new Date(po.orderDate).setDate(new Date(po.orderDate).getDate() + 30));
      
      let daysOverdue = 0;
      if (today > due) {
        const diffTime = Math.abs(today.getTime() - due.getTime());
        daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      if (daysOverdue > 0 || po.outstanding > 0) {
        allOverdue.push({
          id: po.id,
          type: 'PAYABLE',
          referenceNumber: po.poNumber,
          entityName: po.supplier?.name || 'Unknown',
          entityPhone: po.supplier?.phone,
          date: po.orderDate,
          dueDate: due,
          totalAmount: po.totalAmount,
          paidAmount: po.paidAmount,
          outstanding: po.outstanding,
          daysOverdue,
        });
      }
    });

    // Sort by most overdue first
    allOverdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return jsonResponse(allOverdue);
  } catch (error: any) {
    console.error('Overdue API Error:', error);
    return errorResponse(error.message || 'Failed to fetch overdue records', 500);
  }
}
