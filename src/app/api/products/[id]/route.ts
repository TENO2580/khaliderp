import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { calculateProductPricing } from '@/lib/pricing-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id }
    });

    if (!product) return errorResponse('Product not found', 404);

    return jsonResponse(product, 200, 'Product fetched successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch product', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    
    // Fetch global profile for recalculation
    const profile = await prisma.costingProfile.findFirst();
    if (!profile) return errorResponse('Global pricing profile not found', 400);

    const calcs = calculateProductPricing(body as any, profile);

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: body.name,
        category: body.category || null,
        sku: body.sku || null,
        description: body.description || null,
        status: body.status || 'ACTIVE',
        weightKg: Number(body.weightKg) || 0,
        qty: Number(body.qty) || 1,
        prodCostPerKg: body.prodCostPerKg !== null && body.prodCostPerKg !== undefined && body.prodCostPerKg !== '' ? Number(body.prodCostPerKg) : null,
        sellingPrice: Number(body.sellingPrice) || 0,
        mrp: Number(body.mrp) || 0,
        regionalPrice: Number(body.regionalPrice) || 0,
        // Update stored metrics
        totalProdCost: calcs.totalProdCost,
        marginAmt: calcs.marginAmt,
        marginPct: calcs.marginPct,
        sellingCostPerKg: calcs.sellingCostPerKg
      }
    });

    return jsonResponse(product, 200, 'Product updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update product', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    await prisma.product.delete({
      where: { id: params.id }
    });
    return jsonResponse(null, 200, 'Product deleted successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete product', 500);
  }
}
