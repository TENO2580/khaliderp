import { NextRequest } from 'next/server';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import { ImportExecutionService } from '@/lib/services/import/ImportExecutionService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      validatedRows = [],
      mode = 'ADD_NEW',
      batchResolutions = {},
      fileName = 'orders_import.xlsx',
      fileSize = 0,
      mappingUsed = {},
      options = {},
    } = body;

    if (!Array.isArray(validatedRows) || validatedRows.length === 0) {
      return errorResponse('No validated rows provided for execution.', 400);
    }

    const result = await ImportExecutionService.executeImport({
      validatedRows,
      mode,
      batchResolutions,
      fileName,
      fileSize,
      mappingUsed,
      options,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    return jsonResponse(
      result,
      200,
      `Import processed: ${result.createdCount} created, ${result.updatedCount} updated, ${result.skippedCount} skipped, ${result.failedCount} failed.`
    );
  } catch (err: any) {
    console.error('Import execution error:', err);
    return errorResponse(err.message || 'Import execution failed', 500);
  }
}
