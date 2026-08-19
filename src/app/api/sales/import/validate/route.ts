import { NextRequest } from 'next/server';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { ColumnMappingService } from '@/lib/services/import/ColumnMappingService';
import { DataValidationService } from '@/lib/services/import/DataValidationService';
import { DuplicateDetectionService } from '@/lib/services/import/DuplicateDetectionService';
import { BatchResolutionService } from '@/lib/services/import/BatchResolutionService';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { rows = [], mappings, options = { calculationMode: 'calculate_auto' }, presetId } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return errorResponse('No data rows provided for validation.', 400);
    }

    // Extract headers from first rows
    const headerSet = new Set<string>();
    rows.slice(0, 50).forEach((r) => {
      if (typeof r === 'object' && r !== null) {
        Object.keys(r).forEach((k) => headerSet.add(k));
      }
    });
    const uploadedHeaders = Array.from(headerSet);

    // If preset ID provided, load saved preset mappings
    let presetMappings: Record<string, string> | undefined;
    if (presetId) {
      const preset = await prisma.mappingPreset.findUnique({
        where: { id: presetId },
      });
      if (preset) {
        try {
          presetMappings = JSON.parse(preset.mappings);
        } catch (e) {}
      }
    }

    // 1. Column Mapping
    let activeMappings = mappings;
    let mappingResult = ColumnMappingService.autoMapColumns(uploadedHeaders, presetMappings);
    if (!activeMappings || Object.keys(activeMappings).length === 0) {
      activeMappings = mappingResult.mappings;
    }

    // 2. Data Validation
    const validationResult = DataValidationService.validateDataset(rows, activeMappings, {
      calculationMode: options.calculationMode || 'calculate_auto',
      defaultStatus: options.defaultStatus || 'DELIVERED',
      defaultType: options.defaultType || 'WHITE CANDLE',
    });

    // 3. Duplicate Detection
    const duplicateResult = await DuplicateDetectionService.checkDuplicates(validationResult.validatedRows);

    // 4. Batch Resolution
    const batchStrings = duplicateResult.rowsWithDuplicateFlags
      .filter((r) => r.isValid)
      .map((r) => r.normalizedData.batchUsed)
      .filter(Boolean);

    const batchResolution = await BatchResolutionService.resolveBatches(batchStrings);

    // Recalculate summary with duplicate count
    const summary = {
      ...validationResult.summary,
      duplicateCount: duplicateResult.duplicateCount,
    };

    return jsonResponse({
      data: {
        systemFields: ColumnMappingService.getSystemFields(),
        columnMapping: {
          mappings: activeMappings,
          confidences: mappingResult.confidences,
          unmappedHeaders: mappingResult.unmappedHeaders,
        },
        validatedRows: duplicateResult.rowsWithDuplicateFlags,
        summary,
        batchResolution: {
          existingBatches: batchResolution.existingBatches,
          unknownBatches: batchResolution.unknownBatches,
          resolvedMap: batchResolution.resolvedMap,
        },
        duplicateMatches: duplicateResult.duplicateMatches,
      },
    });
  } catch (err: any) {
    console.error('Import validation error:', err);
    return errorResponse(err.message || 'Validation failed', 500);
  }
}
