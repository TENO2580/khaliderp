import prisma from '@/lib/db';

export interface BatchItemResolution {
  rawName: string;
  matchedBatchId: string | null;
  matchedBatchNumber: string | null;
  status: 'FOUND' | 'UNKNOWN';
}

export interface UnknownBatchSummary {
  name: string;
  occurrenceCount: number;
  sampleRows: number[];
}

export interface BatchResolutionOption {
  action: 'create' | 'map' | 'preserve_notes' | 'skip';
  targetBatchId?: string;
  newBatchDetails?: {
    batchNumber: string;
    productName?: string;
    initialQty?: number;
  };
}

export class BatchResolutionService {
  /**
   * Split multiple batch names from text like "BATCH ZERO, BATCH ONE" or "BATCH ZERO + BATCH ONE"
   */
  static splitBatchNames(batchStr: string): string[] {
    if (!batchStr) return [];
    return batchStr
      .split(/[,+;&\n]|(?:\band\b)/gi)
      .map((b) => b.trim())
      .filter(Boolean);
  }

  /**
   * Check all batch names in the dataset against database
   */
  static async resolveBatches(batchStrings: string[]): Promise<{
    existingBatches: { id: string; batchNumber: string; remainingQty: number }[];
    unknownBatches: UnknownBatchSummary[];
    resolvedMap: Record<string, BatchItemResolution>;
  }> {
    const dbBatches = await prisma.batch.findMany({
      select: {
        id: true,
        batchNumber: true,
        remainingQty: true,
      },
    });

    const dbBatchMap = new Map<string, { id: string; batchNumber: string; remainingQty: number }>();
    for (const b of dbBatches) {
      dbBatchMap.set(b.batchNumber.trim().toUpperCase(), b);
    }

    const uniqueRawNames = new Set<string>();
    const occurrences: Record<string, { count: number; rows: number[] }> = {};

    batchStrings.forEach((str, idx) => {
      const parts = this.splitBatchNames(str);
      parts.forEach((name) => {
        const upper = name.toUpperCase();
        uniqueRawNames.add(name);
        if (!occurrences[upper]) {
          occurrences[upper] = { count: 0, rows: [] };
        }
        occurrences[upper].count++;
        if (occurrences[upper].rows.length < 5) {
          occurrences[upper].rows.push(idx + 1);
        }
      });
    });

    const resolvedMap: Record<string, BatchItemResolution> = {};
    const unknownBatches: UnknownBatchSummary[] = [];

    uniqueRawNames.forEach((raw) => {
      const upper = raw.toUpperCase();
      const match = dbBatchMap.get(upper);

      if (match) {
        resolvedMap[raw] = {
          rawName: raw,
          matchedBatchId: match.id,
          matchedBatchNumber: match.batchNumber,
          status: 'FOUND',
        };
      } else {
        resolvedMap[raw] = {
          rawName: raw,
          matchedBatchId: null,
          matchedBatchNumber: null,
          status: 'UNKNOWN',
        };
        unknownBatches.push({
          name: raw,
          occurrenceCount: occurrences[upper]?.count || 1,
          sampleRows: occurrences[upper]?.rows || [],
        });
      }
    });

    return {
      existingBatches: dbBatches,
      unknownBatches,
      resolvedMap,
    };
  }

  /**
   * Apply batch resolution options (creating new batches or mapping to existing ones)
   */
  static async applyBatchResolutions(
    resolutions: Record<string, BatchResolutionOption>,
    userId?: string
  ): Promise<Record<string, { batchId: string | null; batchNumber: string }>> {
    const finalMap: Record<string, { batchId: string | null; batchNumber: string }> = {};

    for (const [rawName, option] of Object.entries(resolutions)) {
      if (option.action === 'create') {
        const batchNum = (option.newBatchDetails?.batchNumber || rawName).toUpperCase().trim();
        // Check if already created
        const existing = await prisma.batch.findUnique({
          where: { batchNumber: batchNum },
        });

        if (existing) {
          finalMap[rawName] = { batchId: existing.id, batchNumber: existing.batchNumber };
        } else {
          // Create batch record
          const created = await prisma.batch.create({
            data: {
              batchNumber: batchNum,
              status: 'COMPLETED',
              waxInitialQty: option.newBatchDetails?.initialQty || 1000,
              producedQty: option.newBatchDetails?.initialQty || 1000,
              remainingQty: option.newBatchDetails?.initialQty || 1000,
              purchaseDate: new Date(),
            },
          });
          finalMap[rawName] = { batchId: created.id, batchNumber: created.batchNumber };
        }
      } else if (option.action === 'map' && option.targetBatchId) {
        const target = await prisma.batch.findUnique({
          where: { id: option.targetBatchId },
          select: { id: true, batchNumber: true },
        });
        if (target) {
          finalMap[rawName] = { batchId: target.id, batchNumber: target.batchNumber };
        } else {
          finalMap[rawName] = { batchId: null, batchNumber: rawName };
        }
      } else {
        // preserve_notes or skip
        finalMap[rawName] = { batchId: null, batchNumber: rawName };
      }
    }

    return finalMap;
  }
}
