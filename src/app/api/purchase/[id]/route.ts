import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { rawMaterial: true } },
      },
    });

    if (!po) {
      return errorResponse('Purchase Order not found', 404);
    }

    return jsonResponse({
      data: {
        id: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplier.name,
        orderDate: po.orderDate,
        expectedDate: po.expectedDate,
        status: po.status,
        paymentStatus: po.paymentStatus,
        totalAmount: po.totalAmount,
        notes: po.notes,
        material: po.items[0]?.rawMaterial?.name || '',
        quantity: po.items[0]?.quantity || 0,
        unitPrice: po.items[0]?.unitPrice || 0,
        items: po.items,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch Purchase Order', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { supplierName, material, quantity, unitPrice, status, paymentStatus, orderDate, expectedDate, notes } = body;

    const existingPo = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingPo) {
      return errorResponse('Purchase Order not found', 404);
    }

    let supplierId = existingPo.supplierId;
    if (supplierName) {
      let supplier = await prisma.supplier.findFirst({ where: { name: supplierName } });
      if (!supplier) {
        supplier = await prisma.supplier.create({ data: { name: supplierName } });
      }
      supplierId = supplier.id;
    }

    let rawMaterialId = existingPo.items[0]?.rawMaterialId;
    if (material) {
      let rawMaterial = await prisma.rawMaterial.findFirst({ where: { name: material } });
      if (!rawMaterial) {
        rawMaterial = await prisma.rawMaterial.create({
          data: { name: material, category: 'OTHER' },
        });
      }
      rawMaterialId = rawMaterial.id;
    }

    const qty = quantity !== undefined ? Number(quantity) : existingPo.items[0]?.quantity || 0;
    const price = unitPrice !== undefined ? Number(unitPrice) : existingPo.items[0]?.unitPrice || 0;
    const amount = qty * price;

    const updatedPo = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplierId,
        totalAmount: amount,
        subtotal: amount,
        status: status || existingPo.status,
        paymentStatus: paymentStatus || existingPo.paymentStatus,
        orderDate: orderDate ? new Date(orderDate) : existingPo.orderDate,
        expectedDate: expectedDate ? new Date(expectedDate) : existingPo.expectedDate,
        notes: notes !== undefined ? notes : existingPo.notes,
      },
    });

    // Update item
    if (existingPo.items.length > 0 && rawMaterialId) {
      await prisma.purchaseItem.update({
        where: { id: existingPo.items[0].id },
        data: {
          rawMaterialId,
          quantity: qty,
          unitPrice: price,
          amount,
        },
      });
    }

    return jsonResponse(updatedPo, 200, 'Purchase Order updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update Purchase Order', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;

    await prisma.purchaseOrder.delete({
      where: { id },
    });

    return jsonResponse({ message: 'Purchase Order deleted successfully' });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete Purchase Order', 400);
  }
}
