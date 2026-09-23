import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch invoices that have outstanding > 0 and a dueDate earlier than today
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        outstanding: { gt: 0 },
        dueDate: { lt: today },
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          }
        },
        order: {
          select: {
            orderNumber: true,
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    const data = overdueInvoices.map(inv => {
      const due = inv.dueDate ? new Date(inv.dueDate) : null;
      let daysOverdue = 0;
      if (due) {
        const diffTime = Math.abs(today.getTime() - due.getTime());
        daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        orderNumber: inv.order?.orderNumber,
        customerName: inv.customer?.name || 'Unknown',
        customerPhone: inv.customer?.phone,
        invoiceDate: inv.invoiceDate,
        dueDate: inv.dueDate,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        outstanding: inv.outstanding,
        daysOverdue,
      };
    });

    return jsonResponse(data);
  } catch (error: any) {
    console.error('Overdue API Error:', error);
    return errorResponse(error.message || 'Failed to fetch overdue records', 500);
  }
}
