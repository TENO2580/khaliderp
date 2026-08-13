const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting product migration...');
  const profiles = await prisma.costingProfile.findMany({
    include: {
      caseVariants: true,
      rsCaseVariants: true,
    }
  });

  console.log(`Found ${profiles.length} pricing profiles.`);

  for (const profile of profiles) {
    const globalCostPerKg = 
      profile.waxCost + 
      profile.otherMaterials + 
      profile.labourCost + 
      profile.electricityCost + 
      profile.energyCost + 
      profile.transportCost;
    
    const globalTotalCostPerKg = globalCostPerKg + profile.packagingOverhead;

    // Migrate CaseVariants
    for (const v of profile.caseVariants) {
      console.log(`Migrating (CaseVariant): ${v.name}`);
      const effectiveProdCostPerKg = v.prodCostPerKg ?? globalTotalCostPerKg;
      const totalWeight = v.weightKg * (v.qty || 1);
      const totalProdCost = totalWeight * effectiveProdCostPerKg;
      const marginAmt = (v.calicutRate || v.sellingPrice) - totalProdCost;
      const marginPct = (v.calicutRate || v.sellingPrice) > 0 ? (marginAmt / (v.calicutRate || v.sellingPrice)) * 100 : 0;
      const sellingCostPerKg = totalWeight > 0 ? (v.calicutRate || v.sellingPrice) / totalWeight : 0;

      await prisma.product.create({
        data: {
          name: v.name,
          sku: v.name.replace(/\s+/g, '-').toUpperCase() + '-' + Math.random().toString(36).substring(2, 7),
          category: 'CANDLES',
          weightKg: v.weightKg,
          qty: v.qty || 1,
          prodCostPerKg: v.prodCostPerKg,
          sellingPrice: v.sellingPrice,
          mrp: v.mrp || 0,
          regionalPrice: v.calicutRate || 0,
          profileId: profile.id,
          totalProdCost,
          marginAmt,
          marginPct,
          sellingCostPerKg
        }
      });
    }

    // Migrate RsCaseVariants
    for (const v of profile.rsCaseVariants) {
      console.log(`Migrating (RsCaseVariant): ${v.name}`);
      const effectiveProdCostPerKg = v.prodCostPerKg ?? globalTotalCostPerKg;
      const totalWeight = v.weightKg * (v.qty || 1);
      const totalProdCost = totalWeight * effectiveProdCostPerKg;
      const marginAmt = (v.calicutRate || v.sellingPrice) - totalProdCost;
      const marginPct = (v.calicutRate || v.sellingPrice) > 0 ? (marginAmt / (v.calicutRate || v.sellingPrice)) * 100 : 0;
      const sellingCostPerKg = totalWeight > 0 ? (v.calicutRate || v.sellingPrice) / totalWeight : 0;

      await prisma.product.create({
        data: {
          name: v.name,
          sku: v.name.replace(/\s+/g, '-').toUpperCase() + '-' + Math.random().toString(36).substring(2, 7),
          category: 'RS_CASE',
          weightKg: v.weightKg,
          qty: v.qty || 1,
          prodCostPerKg: v.prodCostPerKg,
          sellingPrice: v.sellingPrice,
          mrp: v.mrp || 0,
          regionalPrice: v.calicutRate || 0,
          profileId: profile.id,
          totalProdCost,
          marginAmt,
          marginPct,
          sellingCostPerKg
        }
      });
    }
  }

  console.log('Migration complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
