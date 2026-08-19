import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const production = await prisma.production.findUnique({
      where: { id },
      include: {
        batch: true,
        operator: true,
      },
    });

    if (!production) {
      return errorResponse('Production run not found', 404);
    }

    return jsonResponse(production);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch production run', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.production.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse('Production run not found', 404);
    }

    const {
      date,
      batchId = existing.batchId,
      shift = existing.shift,
      waxUsed = existing.waxUsed,
      fragranceUsed = existing.fragranceUsed,
      colorUsed = existing.colorUsed,
      containerUsed = existing.containerUsed,
      wickUsed = existing.wickUsed,
      labourCost = existing.labourCost,
      gasCost = existing.gasCost,
      electricityCost = existing.electricityCost,
      otherCosts = existing.otherCosts,
      quantityProduced = existing.quantityProduced,
      sellingPrice = existing.sellingPrice,
      notes = existing.notes,
    } = body;

    const waxCost = Number(waxUsed) * 85;
    const fragranceCost = Number(fragranceUsed) * 400;
    const colorCost = Number(colorUsed) * 250;
    const containerCost = Number(containerUsed) * 25;
    const wickCost = Number(wickUsed) * 2;

    const totalRawMaterialCost = waxCost + fragranceCost + colorCost + containerCost + wickCost;
    const totalOverheadCost = Number(labourCost) + Number(gasCost) + Number(electricityCost) + Number(otherCosts);
    const totalCost = totalRawMaterialCost + totalOverheadCost;

    const costPerKg = Number(waxUsed) > 0 ? totalCost / Number(waxUsed) : 0;
    const totalRevenue = Number(quantityProduced) * Number(sellingPrice);
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    const updated = await prisma.production.update({
      where: { id },
      data: {
        date: date ? new Date(date) : existing.date,
        batchId,
        shift: shift === 'NIGHT' ? 'NIGHT' : 'DAY',
        waxUsed: Number(waxUsed),
        fragranceUsed: Number(fragranceUsed),
        colorUsed: Number(colorUsed),
        containerUsed: Number(containerUsed),
        wickUsed: Number(wickUsed),
        labourCost: Number(labourCost),
        gasCost: Number(gasCost),
        electricityCost: Number(electricityCost),
        otherCosts: Number(otherCosts),
        totalCost,
        quantityProduced: Number(quantityProduced),
        costPerKg,
        sellingPrice: Number(sellingPrice),
        profit,
        margin,
        notes,
      },
      include: { batch: true, operator: true },
    });

    return jsonResponse(updated, 200, 'Production run updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update production run', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;

    await prisma.production.delete({
      where: { id },
    });

    return jsonResponse({ message: 'Production run deleted successfully' });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete production run', 400);
  }
}
