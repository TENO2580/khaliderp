import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { calculateProductPricing } from '@/lib/pricing-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return jsonResponse({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, 200, 'Products fetched successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch products', 500);
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    
    // First, fetch the global costing profile to calculate margins
    const profile = await prisma.costingProfile.findFirst();
    if (!profile) {
      return errorResponse('No pricing profile found. Please save global pricing first.', 400);
    }

    // Calculate economics before saving
    const calcs = calculateProductPricing(body as any, profile);

    const product = await prisma.product.create({
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
        profileId: profile.id,
        // Stored metrics
        totalProdCost: calcs.totalProdCost,
        marginAmt: calcs.marginAmt,
        marginPct: calcs.marginPct,
        sellingCostPerKg: calcs.sellingCostPerKg
      }
    });

    return jsonResponse(product, 201, 'Product created successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create product', 500);
  }
}
