export interface PricingProductInput {
  weightKg: number;
  qty: number;
  prodCostPerKg?: number | null;
  sellingPrice: number;
  regionalPrice?: number | null;
  mrp?: number | null;
}

export interface GlobalCostingProfile {
  waxCost: number;
  otherMaterials: number;
  labourCost: number;
  electricityCost: number;
  energyCost: number;
  transportCost: number;
  packagingOverhead: number;
}

/**
 * Reusable Calculation Service for Product Pricing
 * Contains exact formulas used in the legacy pricing engine.
 */
export function calculateProductPricing(
  product: PricingProductInput,
  globalProfile: GlobalCostingProfile
) {
  // 1. Calculate Global 1KG Cost
  const globalCostPerKg = 
    Number(globalProfile.waxCost || 0) + 
    Number(globalProfile.otherMaterials || 0) + 
    Number(globalProfile.labourCost || 0) + 
    Number(globalProfile.electricityCost || 0) + 
    Number(globalProfile.energyCost || 0) + 
    Number(globalProfile.transportCost || 0);
    
  const globalTotalCostPerKg = globalCostPerKg + Number(globalProfile.packagingOverhead || 0);
  
  // 2. Use Override or Global Cost
  const effectiveProdCostPerKg = (product.prodCostPerKg !== null && product.prodCostPerKg !== undefined && product.prodCostPerKg !== 0 && String(product.prodCostPerKg) !== '') 
    ? Number(product.prodCostPerKg) 
    : globalTotalCostPerKg;
  
  // 3. Product Calculations
  const weight = Number(product.weightKg) || 0;
  const qty = Number(product.qty) || 1;
  const sellingPrice = Number(product.sellingPrice) || 0;
  
  const totalWeight = weight * qty;
  const totalProdCost = totalWeight * effectiveProdCostPerKg;
  
  // Margins calculated based on sellingPrice (identical to legacy UI logic)
  const marginAmt = sellingPrice - totalProdCost;
  const marginPct = sellingPrice > 0 ? (marginAmt / sellingPrice) * 100 : 0;
  
  // Selling Cost per KG
  const sellingCostPerKg = totalWeight > 0 ? sellingPrice / totalWeight : 0;
  
  return { 
    totalProdCost, 
    marginAmt, 
    marginPct, 
    sellingCostPerKg, 
    effectiveProdCostPerKg 
  };
}
