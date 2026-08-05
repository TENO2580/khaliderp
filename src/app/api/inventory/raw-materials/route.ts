import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const category = url.searchParams.get('category') || '';

  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const skip = (page - 1) * limit;
  const where: any = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (category) {
    where.category = category;
  }

  const [data, total] = await Promise.all([
    prisma.rawMaterial.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
        unit: true,
        currentStock: true,
        minimumStock: true,
        reorderLevel: true,
        unitCost: true,
        isActive: true,
        updatedAt: true
      }
    }),
    prisma.rawMaterial.count({ where })
  ]);

  return jsonResponse({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, category, unit, currentStock, reorderLevel, unitCost } = body;

    const rawMaterial = await prisma.rawMaterial.create({
      data: {
        name,
        category,
        unit: unit || 'KG',
        currentStock: Number(currentStock || 0),
        reorderLevel: Number(reorderLevel || 0),
        unitCost: Number(unitCost || 0),
      },
    });

    return jsonResponse(rawMaterial, 201, 'Raw material created successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create raw material', 400);
  }
}
