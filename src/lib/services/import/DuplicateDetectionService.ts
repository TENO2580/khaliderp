import prisma from '@/lib/db';
import { ValidatedRow } from './DataValidationService';

export interface DuplicateMatch {
  rowIndex: number;
  existingOrderId: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  totalAmount: number;
  matchScore: number;
  matchReason: string;
}

export class DuplicateDetectionService {
  /**
   * Check validated rows against database for existing orders
   */
  static async checkDuplicates(validatedRows: ValidatedRow[]): Promise<{
    rowsWithDuplicateFlags: ValidatedRow[];
    duplicateCount: number;
    duplicateMatches: DuplicateMatch[];
  }> {
    const validRows = validatedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      return {
        rowsWithDuplicateFlags: validatedRows,
        duplicateCount: 0,
        duplicateMatches: [],
      };
    }

    // Collect all customer names and date ranges
    const customerNames = Array.from(new Set(validRows.map((r) => r.normalizedData.customerName.toLowerCase())));
    const dates = validRows.map((r) => new Date(r.normalizedData.orderDate)).filter((d) => !isNaN(d.getTime()));

    let minDate = new Date();
    let maxDate = new Date();
    if (dates.length > 0) {
      minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
      // Extend window slightly
      minDate.setDate(minDate.getDate() - 1);
      maxDate.setDate(maxDate.getDate() + 1);
    }

    // Query existing sales orders in the window with customer names
    const existingOrders = await prisma.salesOrder.findMany({
      where: {
        orderDate: {
          gte: minDate,
          lte: maxDate,
        },
      },
      include: {
        customer: { select: { name: true } },
        items: { select: { quantity: true, unitPrice: true } },
      },
    });

    const duplicateMatches: DuplicateMatch[] = [];
    let duplicateCount = 0;

    const rowsWithDuplicateFlags = validatedRows.map((row) => {
      if (!row.isValid) return row;

      const { customerName, orderDate, totalSellingCost, quantity } = row.normalizedData;
      const targetCustomer = customerName.toLowerCase().trim();
      const targetDateStr = orderDate;

      // Search matching existing order
      const matched = existingOrders.find((ex) => {
        const exCustomer = (ex.customer?.name || '').toLowerCase().trim();
        const exDateStr = ex.orderDate ? new Date(ex.orderDate).toISOString().split('T')[0] : '';
        const exTotal = ex.totalAmount || 0;
        const exQty = ex.items?.reduce((s, i) => s + i.quantity, 0) || 0;

        const customerMatches = exCustomer === targetCustomer || exCustomer.includes(targetCustomer) || targetCustomer.includes(exCustomer);
        const dateMatches = exDateStr === targetDateStr;
        const totalMatches = Math.abs(exTotal - totalSellingCost) < 1;
        const qtyMatches = Math.abs(exQty - quantity) < 0.1;

        return customerMatches && dateMatches && (totalMatches || qtyMatches);
      });

      if (matched) {
        duplicateCount++;
        const matchInfo: DuplicateMatch = {
          rowIndex: row.rowIndex,
          existingOrderId: matched.id,
          orderNumber: matched.orderNumber,
          customerName: matched.customer?.name || '',
          orderDate: matched.orderDate ? new Date(matched.orderDate).toISOString().split('T')[0] : '',
          totalAmount: matched.totalAmount || 0,
          matchScore: 95,
          matchReason: `Matches existing order ${matched.orderNumber} for ${matched.customer?.name || 'Customer'} on ${orderDate}`,
        };
        duplicateMatches.push(matchInfo);

        return {
          ...row,
          isDuplicate: true,
          duplicateDetails: matchInfo.matchReason,
          warnings: [
            ...row.warnings,
            {
              field: 'Duplicate',
              message: matchInfo.matchReason,
            },
          ],
        };
      }

      return row;
    });

    return {
      rowsWithDuplicateFlags,
      duplicateCount,
      duplicateMatches,
    };
  }
}
