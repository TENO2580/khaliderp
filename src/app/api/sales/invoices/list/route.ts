import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: 'desc' },
      skip,
      take: limit,
      include: { 
        order: {
          include: { items: { include: { product: true } } }
        },
        customer: true 
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  // Format data for the frontend table
  const formattedData = data.map((inv: any) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    orderNumber: inv.order?.orderNumber,
    customerName: inv.customer?.name,
    customerAddress: inv.customer?.address,
    customerPhone: inv.customer?.phone,
    customerGst: inv.customer?.gstin,
    ownerName: inv.customer?.ownerName,
    invoiceDate: inv.invoiceDate,
    dueDate: inv.dueDate,
    gstAmount: inv.totalGst,
    totalAmount: inv.totalAmount,
    taxableAmount: inv.subtotal,
    cgstTotal: inv.cgst,
    sgstTotal: inv.sgst,
    transportCharge: inv.transportCharge,
    status: inv.status,
    customer: inv.customer,
    order: inv.order,
    items: inv.order?.items?.map((item: any) => ({
      name: item.product?.name,
      hsn: item.product?.hsnCode || '34060010',
      qty: item.quantity,
      price: item.unitPrice,
      taxable: item.taxableAmount || (item.quantity * item.unitPrice),
      cgst: item.cgst,
      sgst: item.sgst,
      total: item.total || (item.taxableAmount || (item.quantity * item.unitPrice)) + (item.cgst || 0) + (item.sgst || 0)
    })) || []
  }));

  return jsonResponse({
    data: formattedData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
}
