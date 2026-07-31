import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const date = url.searchParams.get('date') || '';
  const month = url.searchParams.get('month') || '';
  const status = url.searchParams.get('status') || '';

  const where: any = {};
  if (search) {
    where.OR = [
      { poNumber: { contains: search, mode: 'insensitive' } },
      { supplier: { name: { contains: search, mode: 'insensitive' } } }
    ];
  }

  if (status) {
    where.status = status;
  }

  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      where.orderDate = {
        gte: new Date(d.setHours(0, 0, 0, 0)),
        lt: new Date(d.setHours(23, 59, 59, 999)),
      };
    }
  } else if (month) {
    const [y, m] = month.split('-');
    if (y && m) {
      const start = new Date(parseInt(y), parseInt(m) - 1, 1);
      const end = new Date(parseInt(y), parseInt(m), 1);
      where.orderDate = {
        gte: start,
        lt: end,
      };
    }
  }

  const purchases = await prisma.purchaseOrder.findMany({
    where,
    orderBy: { orderDate: 'desc' },
    include: { supplier: true, items: { include: { rawMaterial: true } } },
  });

  const formatted = purchases.map((p) => ({
    id: p.id,
    poNumber: p.poNumber,
    supplierName: p.supplier.name,
    orderDate: p.orderDate,
    material: p.items.length > 0 ? `${p.items[0].rawMaterial.name} (${p.items[0].quantity} Units)` : 'N/A',
    totalAmount: p.totalAmount,
    status: p.status,
    paymentStatus: p.paymentStatus,
  }));

  return jsonResponse({ data: formatted });
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { supplierName, material, quantity, unitPrice } = body;

    let supplier = await prisma.supplier.findFirst({ where: { name: supplierName } });
    if (!supplier) {
      supplier = await prisma.supplier.create({ data: { name: supplierName } });
    }

    let rawMaterial = await prisma.rawMaterial.findFirst({ where: { name: material } });
    if (!rawMaterial) {
      rawMaterial = await prisma.rawMaterial.create({
        data: { name: material, category: 'OTHER' }
      });
    }

    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-2026-${String(count + 1).padStart(4, '0')}`;
    const amount = Number(quantity) * Number(unitPrice);

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: supplier.id,
        totalAmount: amount,
        subtotal: amount,
        createdBy: user?.id,
        items: {
          create: [{
            rawMaterialId: rawMaterial.id,
            quantity: Number(quantity),
            unitPrice: Number(unitPrice),
            amount,
          }]
        }
      },
    });

    return jsonResponse(po, 201, 'Purchase order created successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create PO', 400);
  }
}
