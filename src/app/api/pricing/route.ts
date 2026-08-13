import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { calculateProductPricing } from '@/lib/pricing-engine';

export const dynamic = 'force-dynamic';

const DEFAULT_PRICING = {
  name: "Default Pricing",
  waxCost: 154.00,
  otherMaterials: 1.00,
  labourCost: 7.00,
  electricityCost: 2.00,
  energyCost: 1.00,
  transportCost: 2.00,
  packagingOverhead: 10.00,
  sellingPrice: 195.00,
};

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    let profile = await prisma.costingProfile.findFirst();

    // Seed if none exists
    if (!profile) {
      profile = await prisma.costingProfile.create({
        data: DEFAULT_PRICING
      });
    }

    return jsonResponse(profile, 200, 'Pricing profile fetched');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch pricing profile', 500);
  }
}

export async function PUT(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { id, waxCost, otherMaterials, labourCost, electricityCost, energyCost, transportCost, packagingOverhead, sellingPrice } = body;

    if (!id) {
      return errorResponse('Profile ID is required', 400);
    }

    const updatedProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.costingProfile.update({
        where: { id },
        data: {
          waxCost: Number(waxCost),
          otherMaterials: Number(otherMaterials),
          labourCost: Number(labourCost),
          electricityCost: Number(electricityCost),
          energyCost: Number(energyCost),
          transportCost: Number(transportCost),
          packagingOverhead: Number(packagingOverhead),
          sellingPrice: Number(sellingPrice),
        }
      });

      // Recalculate all products that depend on this profile
      const products = await tx.product.findMany({
        where: { profileId: id }
      });

      for (const prod of products) {
        const calcs = calculateProductPricing(prod as any, profile);

        await tx.product.update({
          where: { id: prod.id },
          data: {
            totalProdCost: calcs.totalProdCost,
            marginAmt: calcs.marginAmt,
            marginPct: calcs.marginPct,
            sellingCostPerKg: calcs.sellingCostPerKg
          }
        });
      }

      return profile;
    });

    return jsonResponse(updatedProfile, 200, 'Pricing data updated and products recalculated');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update pricing data', 500);
  }
}
