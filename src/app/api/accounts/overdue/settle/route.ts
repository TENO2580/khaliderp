import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function POST(req: NextRequest) {
  try {
    const { id, type } = await req.json();

    if (!id || !type) {
      return errorResponse('Missing required fields', 400);
    }

    if (type === 'RECEIVABLE') {
      const order = await prisma.salesOrder.findUnique({ where: { id } });
      if (!order) return errorResponse('Sales order not found', 404);

      await prisma.salesOrder.update({
        where: { id },
        data: {
          outstanding: 0,
          paidAmount: order.totalAmount,
          paymentStatus: 'PAID'
        }
      });
      return jsonResponse({ message: 'Order marked as settled' });
    } 
    
    if (type === 'PAYABLE') {
      const po = await prisma.purchaseOrder.findUnique({ where: { id } });
      if (!po) return errorResponse('Purchase order not found', 404);

      await prisma.purchaseOrder.update({
        where: { id },
        data: {
          outstanding: 0,
          paidAmount: po.totalAmount,
          paymentStatus: 'PAID'
        }
      });
      return jsonResponse({ message: 'Purchase order marked as settled' });
    }

    return errorResponse('Invalid type', 400);
  } catch (error: any) {
    console.error('Settle API Error:', error);
    return errorResponse(error.message || 'Failed to settle account', 500);
  }
}
