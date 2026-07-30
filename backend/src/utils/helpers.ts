/**
 * Generate sequential IDs with prefix
 * e.g., generateId('CUST', 1) → 'CUST-0001'
 */
export function generateId(prefix: string, count: number, padLength = 4): string {
  return `${prefix}-${String(count).padStart(padLength, '0')}`;
}

/**
 * Generate a dated sequential ID
 * e.g., generateDatedId('INV', 2026, 1) → 'INV-2026-0001'
 */
export function generateDatedId(prefix: string, year: number, count: number, padLength = 4): string {
  return `${prefix}-${year}-${String(count).padStart(padLength, '0')}`;
}

/**
 * Get current financial year string
 * April to March cycle. e.g., 'FY 2026-27'
 */
export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-indexed
  const year = date.getFullYear();
  if (month >= 3) {
    // April onwards
    return `FY ${year}-${(year + 1).toString().slice(2)}`;
  }
  return `FY ${year - 1}-${year.toString().slice(2)}`;
}

/**
 * Format currency in INR
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate GST components (CGST + SGST for intra-state, IGST for inter-state)
 */
export function calculateGST(
  taxableAmount: number,
  gstRate: number,
  isInterState: boolean
): { cgst: number; sgst: number; igst: number; totalGst: number } {
  const totalGst = (taxableAmount * gstRate) / 100;

  if (isInterState) {
    return { cgst: 0, sgst: 0, igst: totalGst, totalGst };
  }
  return {
    cgst: totalGst / 2,
    sgst: totalGst / 2,
    igst: 0,
    totalGst,
  };
}
