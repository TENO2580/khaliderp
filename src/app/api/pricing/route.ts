import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

// Default seed data based on requirements
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
  caseVariants: {
    create: [
      { name: "2 RS CASE", weightKg: 0.72, sellingPrice: 228.00 },
      { name: "5 RS CASE", weightKg: 2.16, sellingPrice: 585.00 },
      { name: "10 RS CASE", weightKg: 4.32, sellingPrice: 1170.00 },
    ]
  }
};

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    let profile = await prisma.costingProfile.findFirst({
      include: { caseVariants: { orderBy: { weightKg: 'asc' } } }
    });

    // Seed if none exists
    if (!profile) {
      profile = await prisma.costingProfile.create({
        data: DEFAULT_PRICING,
        include: { caseVariants: { orderBy: { weightKg: 'asc' } } }
      });
    }

    return jsonResponse(profile, 200, 'Pricing data fetched');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch pricing data', 500);
  }
}

export async function PUT(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { id, waxCost, otherMaterials, labourCost, electricityCost, energyCost, transportCost, packagingOverhead, sellingPrice, caseVariants } = body;

    if (!id) {
      return errorResponse('Profile ID is required', 400);
    }

    // Use a transaction to update the profile and its variants
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

      // Update or create variants
      if (caseVariants && Array.isArray(caseVariants)) {
        for (const variant of caseVariants) {
          if (variant.id) {
            await tx.caseVariant.update({
              where: { id: variant.id },
              data: {
                name: variant.name,
                weightKg: Number(variant.weightKg),
                prodCostPerKg: variant.prodCostPerKg !== null && variant.prodCostPerKg !== undefined && variant.prodCostPerKg !== '' ? Number(variant.prodCostPerKg) : null,
                sellingPrice: Number(variant.sellingPrice)
              }
            });
          } else {
            await tx.caseVariant.create({
              data: {
                profileId: id,
                name: variant.name,
                weightKg: Number(variant.weightKg),
                prodCostPerKg: variant.prodCostPerKg !== null && variant.prodCostPerKg !== undefined && variant.prodCostPerKg !== '' ? Number(variant.prodCostPerKg) : null,
                sellingPrice: Number(variant.sellingPrice)
              }
            });
          }
        }
      }

      return await tx.costingProfile.findUnique({
        where: { id },
        include: { caseVariants: { orderBy: { weightKg: 'asc' } } }
      });
    });

    return jsonResponse(updatedProfile, 200, 'Pricing data updated');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update pricing data', 500);
  }
}
