import { NextRequest } from 'next/server';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const history = await prisma.importHistory.findFirst({
      where: {
        OR: [
          { id },
          { importId: id }
        ]
      },
    });

    if (!history) {
      return errorResponse('Import record not found', 404);
    }

    return jsonResponse({
      data: {
        ...history,
        mappingUsed: history.mappingUsed ? JSON.parse(history.mappingUsed) : {},
        summary: history.summary ? JSON.parse(history.summary) : {},
        errors: history.errors ? JSON.parse(history.errors) : [],
        importedData: history.importedData ? JSON.parse(history.importedData) : [],
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch import details', 500);
  }
}
