export interface SystemFieldDefinition {
  key: string;
  label: string;
  category: 'customer' | 'order' | 'cost' | 'custom';
  description: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'status';
  synonyms: string[];
  isCalculated?: boolean;
}

export const ORDER_SYSTEM_FIELDS: SystemFieldDefinition[] = [
  {
    key: 'customerName',
    label: 'Name',
    category: 'customer',
    description: 'Customer or buyer business name',
    required: true,
    dataType: 'string',
    synonyms: ['name', 'customer name', 'customer', 'client name', 'client', 'party', 'party name', 'buyer', 'account name', 'customer_name', 'client_name'],
  },
  {
    key: 'batchUsed',
    label: 'Batch Used',
    category: 'order',
    description: 'Single or multiple batch numbers (e.g., BATCH ONE, BATCH TWO)',
    required: false,
    dataType: 'string',
    synonyms: ['batch used', 'batch', 'batch name', 'batch number', 'batches', 'batch no', 'batch_used', 'lot', 'lot number', 'lot no', 'production batch'],
  },
  {
    key: 'orderDate',
    label: 'Order Date',
    category: 'order',
    description: 'Date order was placed (e.g. 04 Aug 2026, 2026-08-04)',
    required: true,
    dataType: 'date',
    synonyms: ['order date', 'order dt', 'ordered on', 'purchase date', 'order_date', 'date', 'booking date', 'creation date', 'po date'],
  },
  {
    key: 'deliveryDate',
    label: 'Delivery Date',
    category: 'order',
    description: 'Date order is/was delivered (optional for pending orders)',
    required: false,
    dataType: 'date',
    synonyms: ['delivery date', 'delivery dt', 'delivered on', 'dispatch date', 'delivery_date', 'due date', 'expected delivery', 'target date'],
  },
  {
    key: 'type',
    label: 'Type',
    category: 'order',
    description: 'Candle / product type (e.g. WHITE CANDLE, PILLAR CANDLE)',
    required: false,
    dataType: 'string',
    synonyms: ['type', 'product', 'product type', 'candle type', 'item type', 'item', 'item name', 'variety', 'sku name', 'category'],
  },
  {
    key: 'quantity',
    label: 'Quantity (KG)',
    category: 'order',
    description: 'Order quantity in KG or Units',
    required: true,
    dataType: 'number',
    synonyms: ['quantity (kg)', 'quantity', 'qty (kg)', 'qty', 'weight (kg)', 'weight', 'total weight', 'weight kg', 'total qty', 'ordered qty', 'quantity_kg'],
  },
  {
    key: 'productionCost',
    label: 'Production Cost',
    category: 'cost',
    description: 'Total manufacturing / production cost in ₹',
    required: false,
    dataType: 'number',
    synonyms: ['production cost', 'production price', 'prod cost', 'mfg cost', 'cost of production', 'making cost', 'factory cost', 'cost price', 'prod_cost'],
  },
  {
    key: 'sellingCost',
    label: 'Selling Cost',
    category: 'cost',
    description: 'Selling cost or unit selling price in ₹',
    required: false,
    dataType: 'number',
    synonyms: ['selling cost', 'selling price', 'sale price', 'unit price', 'rate', 'price', 'rate per kg', 'selling_cost', 'unit selling price', 'billing rate'],
  },
  {
    key: 'marginPct',
    label: 'Margin %',
    category: 'cost',
    description: 'Gross profit margin percentage (e.g. 17.00%)',
    required: false,
    dataType: 'number',
    isCalculated: true,
    synonyms: ['margin %', 'margin', 'margin percentage', 'profit %', 'profit percent', 'profit percentage', 'gross margin', 'margin_pct'],
  },
  {
    key: 'marginAmount',
    label: 'Margin Amount',
    category: 'cost',
    description: 'Total profit amount in ₹ (Selling Cost - Production Cost)',
    required: false,
    dataType: 'number',
    isCalculated: true,
    synonyms: ['margin amount', 'profit', 'profit amt', 'profit amount', 'net profit', 'gain', 'margin_amt'],
  },
  {
    key: 'totalSellingCost',
    label: 'Total Selling Cost',
    category: 'cost',
    description: 'Total billed invoice amount in ₹',
    required: false,
    dataType: 'number',
    isCalculated: true,
    synonyms: ['total selling cost', 'total', 'total amount', 'total cost', 'total price', 'net amount', 'grand total', 'invoice amount', 'total_amount'],
  },
  {
    key: 'status',
    label: 'Status',
    category: 'order',
    description: 'Order status (DELIVERED, PENDING, IN_PRODUCTION, etc.)',
    required: false,
    dataType: 'status',
    synonyms: ['status', 'order status', 'delivery status', 'current status', 'state', 'order_status'],
  },
];

export interface ColumnMappingResult {
  mappings: Record<string, string>; // systemFieldKey -> uploadedHeader
  confidences: Record<string, {
    score: number; // 0 - 100
    level: 'high' | 'medium' | 'low';
    matchReason: string;
  }>;
  unmappedHeaders: string[];
}

function cleanHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[_\-\/\(\)\[\]\.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(s1: string, s2: string): number {
  const clean1 = cleanHeader(s1);
  const clean2 = cleanHeader(s2);

  if (clean1 === clean2) return 1.0;
  if (!clean1 || !clean2) return 0.0;

  // Check if one contains the other
  if (clean1.includes(clean2) || clean2.includes(clean1)) {
    return 0.85;
  }

  // Levenshtein distance based similarity
  const longer = clean1.length > clean2.length ? clean1 : clean2;
  const shorter = clean1.length > clean2.length ? clean2 : clean1;
  
  if (longer.length === 0) return 1.0;
  
  const costs = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  
  const distance = costs[shorter.length];
  return Math.max(0, (longer.length - distance) / longer.length);
}

export class ColumnMappingService {
  static getSystemFields(): SystemFieldDefinition[] {
    return ORDER_SYSTEM_FIELDS;
  }

  static autoMapColumns(uploadedHeaders: string[], presetMappings?: Record<string, string>): ColumnMappingResult {
    const mappings: Record<string, string> = {};
    const confidences: Record<string, { score: number; level: 'high' | 'medium' | 'low'; matchReason: string }> = {};
    const mappedUploadedHeaders = new Set<string>();

    // 1. First apply preset if available
    if (presetMappings) {
      for (const [sysKey, upHeader] of Object.entries(presetMappings)) {
        if (uploadedHeaders.includes(upHeader)) {
          mappings[sysKey] = upHeader;
          confidences[sysKey] = {
            score: 100,
            level: 'high',
            matchReason: 'Saved Preset Match',
          };
          mappedUploadedHeaders.add(upHeader);
        }
      }
    }

    // 2. Map remaining system fields using exact, synonym, and fuzzy logic
    for (const field of ORDER_SYSTEM_FIELDS) {
      if (mappings[field.key]) continue; // Already mapped by preset

      let bestHeader = '';
      let highestScore = 0;
      let matchReason = '';

      for (const rawHeader of uploadedHeaders) {
        if (mappedUploadedHeaders.has(rawHeader)) continue;

        const cleanRaw = cleanHeader(rawHeader);
        const cleanLabel = cleanHeader(field.label);

        // Exact match
        if (cleanRaw === cleanLabel) {
          bestHeader = rawHeader;
          highestScore = 100;
          matchReason = 'Exact Header Match';
          break;
        }

        // Synonym match
        for (const syn of field.synonyms) {
          const cleanSyn = cleanHeader(syn);
          if (cleanRaw === cleanSyn) {
            bestHeader = rawHeader;
            highestScore = 95;
            matchReason = `Matched Synonym ("${syn}")`;
            break;
          }
        }
        if (highestScore >= 95) break;

        // Fuzzy similarity
        const sim = similarity(rawHeader, field.label);
        let maxSynSim = sim;
        let matchedSyn = field.label;

        for (const syn of field.synonyms) {
          const sSim = similarity(rawHeader, syn);
          if (sSim > maxSynSim) {
            maxSynSim = sSim;
            matchedSyn = syn;
          }
        }

        if (maxSynSim > highestScore && maxSynSim >= 0.65) {
          highestScore = Math.round(maxSynSim * 100);
          bestHeader = rawHeader;
          matchReason = `Fuzzy Match with "${matchedSyn}" (${highestScore}%)`;
        }
      }

      if (bestHeader && highestScore >= 65) {
        mappings[field.key] = bestHeader;
        mappedUploadedHeaders.add(bestHeader);
        confidences[field.key] = {
          score: highestScore,
          level: highestScore >= 90 ? 'high' : highestScore >= 75 ? 'medium' : 'low',
          matchReason,
        };
      } else {
        mappings[field.key] = '';
        confidences[field.key] = {
          score: 0,
          level: 'low',
          matchReason: 'Unmapped',
        };
      }
    }

    const unmappedHeaders = uploadedHeaders.filter((h) => !mappedUploadedHeaders.has(h));

    return {
      mappings,
      confidences,
      unmappedHeaders,
    };
  }
}
