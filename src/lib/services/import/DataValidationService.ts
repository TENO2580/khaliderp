export interface ValidatedRow {
  rowIndex: number; // 1-indexed (spreadsheet row)
  rawRow: Record<string, any>;
  normalizedData: {
    customerName: string;
    batchUsed: string;
    orderDate: string; // YYYY-MM-DD
    deliveryDate: string | null; // YYYY-MM-DD or null
    type: string;
    quantity: number;
    productionCost: number;
    sellingCost: number;
    marginPct: number;
    marginAmount: number;
    totalSellingCost: number;
    status: string;
    unmappedFields?: Record<string, any>;
  };
  isValid: boolean;
  isDuplicate?: boolean;
  duplicateDetails?: string;
  errors: { field: string; message: string; suggestedFix?: string }[];
  warnings: { field: string; message: string }[];
}

export interface ValidationOptions {
  calculationMode: 'use_imported' | 'calculate_auto';
  defaultStatus?: string;
  defaultType?: string;
}

const MONTH_NAMES: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  january: '01', february: '02', march: '03', april: '04', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
};

export class DataValidationService {
  /**
   * Parse various date formats (e.g. "04 Aug 2026", "04/08/2026", "2026-08-04", Excel timestamps)
   */
  static parseDate(val: any): { dateStr: string | null; error?: string } {
    if (val === undefined || val === null || val === '') {
      return { dateStr: null };
    }

    // 1. If already Date object
    if (val instanceof Date && !isNaN(val.getTime())) {
      return { dateStr: val.toISOString().split('T')[0] };
    }

    // 2. Excel numeric serial date (e.g., 45508 -> 2024-08-04)
    if (typeof val === 'number' || (!isNaN(Number(val)) && !String(val).includes('-') && !String(val).includes('/'))) {
      const num = Number(val);
      if (num > 20000 && num < 70000) {
        // Excel base date: 1899-12-30
        const jsDate = new Date(Math.round((num - 25569) * 86400 * 1000));
        if (!isNaN(jsDate.getTime())) {
          return { dateStr: jsDate.toISOString().split('T')[0] };
        }
      }
    }

    const str = String(val).trim();
    if (!str) return { dateStr: null };

    // 3. ISO format: YYYY-MM-DD or YYYY/MM/DD
    const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = isoMatch[2].padStart(2, '0');
      const d = isoMatch[3].padStart(2, '0');
      return { dateStr: `${y}-${m}-${d}` };
    }

    // 4. DD Month YYYY (e.g., "04 Aug 2026", "4 August 2026")
    const wordMatch = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (wordMatch) {
      const day = wordMatch[1].padStart(2, '0');
      const monthKey = wordMatch[2].toLowerCase();
      const year = wordMatch[3];
      const monthNum = MONTH_NAMES[monthKey] || MONTH_NAMES[monthKey.slice(0, 3)];
      if (monthNum) {
        return { dateStr: `${year}-${monthNum}-${day}` };
      }
    }

    // 5. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      return { dateStr: `${year}-${month}-${day}` };
    }

    // 6. Generic Date fallback
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return { dateStr: parsed.toISOString().split('T')[0] };
    }

    return { dateStr: null, error: `Invalid date format: "${str}"` };
  }

  /**
   * Clean numeric strings (remove ₹, $, commas, units, %, spaces)
   */
  static parseNumber(val: any, fallback = 0): number {
    if (val === undefined || val === null || val === '') return fallback;
    if (typeof val === 'number') return isNaN(val) ? fallback : val;

    let str = String(val).trim();
    // Remove currency symbols, commas, units like 'kg', 'units', 'pcs'
    str = str.replace(/[₹$€£,]/g, '').replace(/\b(kg|units|pcs|kgs|gm|g)\b/gi, '').trim();

    // Check for percentage
    if (str.endsWith('%')) {
      str = str.replace('%', '').trim();
    }

    const parsed = parseFloat(str);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Normalize Status string to standard OrderStatus enum
   */
  static normalizeStatus(val: any): string {
    if (!val) return 'PENDING';
    const s = String(val).trim().toUpperCase().replace(/\s+/g, '_');

    const statusMap: Record<string, string> = {
      DELIVERED: 'DELIVERED',
      DELIVERY: 'DELIVERED',
      DONE: 'DELIVERED',
      COMPLETED: 'DELIVERED',
      COMPLETE: 'DELIVERED',
      PENDING: 'PENDING',
      NEW: 'PENDING',
      DRAFT: 'PENDING',
      CONFIRMED: 'CONFIRMED',
      APPROVED: 'CONFIRMED',
      IN_PRODUCTION: 'IN_PRODUCTION',
      INPRODUCTION: 'IN_PRODUCTION',
      PRODUCTION: 'IN_PRODUCTION',
      PROCESSING: 'IN_PRODUCTION',
      READY: 'READY',
      PACKED: 'READY',
      DISPATCHED: 'DISPATCHED',
      SHIPPED: 'DISPATCHED',
      IN_TRANSIT: 'DISPATCHED',
      CANCELLED: 'CANCELLED',
      CANCELED: 'CANCELLED',
      RETURNED: 'RETURNED',
    };

    return statusMap[s] || 'PENDING';
  }

  /**
   * Validate and normalize a full dataset given user mapping and calculation options
   */
  static validateDataset(
    rows: Record<string, any>[],
    mappings: Record<string, string>, // systemFieldKey -> uploadedHeader
    options: ValidationOptions
  ): {
    validatedRows: ValidatedRow[];
    summary: {
      totalRows: number;
      validCount: number;
      warningCount: number;
      errorCount: number;
      duplicateCount: number;
    };
  } {
    const validatedRows: ValidatedRow[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    const mappedHeaders = new Set(Object.values(mappings).filter(Boolean));

    rows.forEach((rawRow, index) => {
      const rowIndex = index + 1;
      const errors: { field: string; message: string; suggestedFix?: string }[] = [];
      const warnings: { field: string; message: string }[] = [];

      // 1. Customer Name
      const nameHeader = mappings.customerName;
      const rawName = nameHeader ? rawRow[nameHeader] : '';
      const customerName = String(rawName || '').trim();

      if (!customerName) {
        errors.push({
          field: 'Name',
          message: 'Customer name is required and cannot be empty.',
          suggestedFix: 'Enter customer or buyer name',
        });
      }

      // 2. Batch Used
      const batchHeader = mappings.batchUsed;
      const rawBatch = batchHeader ? rawRow[batchHeader] : '';
      const batchUsed = String(rawBatch || '').trim();

      // 3. Order Date
      const orderDateHeader = mappings.orderDate;
      const rawOrderDate = orderDateHeader ? rawRow[orderDateHeader] : '';
      const parsedOrderDate = this.parseDate(rawOrderDate);
      let orderDate = parsedOrderDate.dateStr;

      if (!orderDate) {
        if (parsedOrderDate.error) {
          errors.push({
            field: 'Order Date',
            message: parsedOrderDate.error,
            suggestedFix: 'Use format YYYY-MM-DD or DD Month YYYY (e.g. 04 Aug 2026)',
          });
        } else {
          errors.push({
            field: 'Order Date',
            message: 'Order date is missing.',
            suggestedFix: 'Provide order booking date',
          });
        }
        orderDate = new Date().toISOString().split('T')[0];
      }

      // 4. Delivery Date
      const deliveryDateHeader = mappings.deliveryDate;
      const rawDeliveryDate = deliveryDateHeader ? rawRow[deliveryDateHeader] : '';
      const parsedDeliveryDate = this.parseDate(rawDeliveryDate);
      const deliveryDate = parsedDeliveryDate.dateStr;

      if (rawDeliveryDate && !deliveryDate && parsedDeliveryDate.error) {
        warnings.push({
          field: 'Delivery Date',
          message: `Unrecognized delivery date "${rawDeliveryDate}". Left blank.`,
        });
      }

      if (orderDate && deliveryDate && new Date(deliveryDate) < new Date(orderDate)) {
        warnings.push({
          field: 'Delivery Date',
          message: `Delivery date (${deliveryDate}) is earlier than Order Date (${orderDate}).`,
        });
      }

      // 5. Type (Product)
      const typeHeader = mappings.type;
      const rawType = typeHeader ? rawRow[typeHeader] : '';
      const type = String(rawType || options.defaultType || 'WHITE CANDLE').trim();

      // 6. Quantity (KG)
      const qtyHeader = mappings.quantity;
      const rawQty = qtyHeader ? rawRow[qtyHeader] : '';
      const quantity = this.parseNumber(rawQty, 0);

      if (quantity <= 0) {
        errors.push({
          field: 'Quantity (KG)',
          message: `Quantity must be a positive numeric value (received "${rawQty}").`,
          suggestedFix: 'Enter numeric quantity in KG',
        });
      }

      // 7. Costs & Calculations
      const prodCostHeader = mappings.productionCost;
      const rawProdCost = prodCostHeader ? rawRow[prodCostHeader] : '';
      const productionCost = this.parseNumber(rawProdCost, 0);

      const sellCostHeader = mappings.sellingCost;
      const rawSellCost = sellCostHeader ? rawRow[sellCostHeader] : '';
      const sellingCost = this.parseNumber(rawSellCost, 0);

      const totalHeader = mappings.totalSellingCost;
      const rawTotal = totalHeader ? rawRow[totalHeader] : '';
      let totalSellingCost = this.parseNumber(rawTotal, 0);

      // Total Selling Cost is quantity (KG) * selling cost (per KG)
      if (options.calculationMode === 'calculate_auto' || !totalSellingCost || (quantity > 1 && totalSellingCost === sellingCost)) {
        if (quantity > 0 && sellingCost > 0) {
          totalSellingCost = quantity * sellingCost;
        } else {
          totalSellingCost = totalSellingCost || sellingCost;
        }
      }

      const marginAmtHeader = mappings.marginAmount;
      const rawMarginAmt = marginAmtHeader ? rawRow[marginAmtHeader] : '';
      let marginAmount = this.parseNumber(rawMarginAmt, 0);

      const marginPctHeader = mappings.marginPct;
      const rawMarginPct = marginPctHeader ? rawRow[marginPctHeader] : '';
      let marginPct = this.parseNumber(rawMarginPct, 0);

      // Margin calculations (per KG or total)
      if (!marginAmount && sellingCost > 0 && productionCost > 0) {
        marginAmount = Math.max(0, sellingCost - productionCost);
      }
      if (!marginPct && sellingCost > 0 && marginAmount > 0) {
        marginPct = (marginAmount / sellingCost) * 100;
      }

      // Round margins
      marginPct = Math.round(marginPct * 100) / 100;
      marginAmount = Math.round(marginAmount * 100) / 100;
      totalSellingCost = Math.round(totalSellingCost * 100) / 100;

      // 8. Status
      const statusHeader = mappings.status;
      const rawStatus = statusHeader ? rawRow[statusHeader] : '';
      const status = this.normalizeStatus(rawStatus || options.defaultStatus || 'DELIVERED');

      // 9. Collect Unmapped Fields
      const unmappedFields: Record<string, any> = {};
      for (const [header, val] of Object.entries(rawRow)) {
        if (!mappedHeaders.has(header) && val !== undefined && val !== null && String(val).trim() !== '') {
          unmappedFields[header] = val;
        }
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
      } else {
        errorCount++;
      }
      if (warnings.length > 0) {
        warningCount++;
      }

      validatedRows.push({
        rowIndex,
        rawRow,
        normalizedData: {
          customerName,
          batchUsed,
          orderDate,
          deliveryDate,
          type,
          quantity,
          productionCost,
          sellingCost,
          marginPct,
          marginAmount,
          totalSellingCost: totalSellingCost || sellingCost,
          status,
          unmappedFields: Object.keys(unmappedFields).length > 0 ? unmappedFields : undefined,
        },
        isValid,
        errors,
        warnings,
      });
    });

    return {
      validatedRows,
      summary: {
        totalRows: rows.length,
        validCount,
        warningCount,
        errorCount,
        duplicateCount: 0,
      },
    };
  }
}
