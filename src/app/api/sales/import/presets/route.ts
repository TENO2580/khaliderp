import { NextRequest } from 'next/server';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const url = new URL(req.url);
    const module = url.searchParams.get('module') || 'ORDERS';

    const presets = await prisma.mappingPreset.findMany({
      where: { module },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    const parsed = presets.map((p) => ({
      ...p,
      mappings: p.mappings ? JSON.parse(p.mappings) : {},
      options: p.options ? JSON.parse(p.options) : {},
    }));

    return jsonResponse(parsed);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch mapping presets', 500);
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, module = 'ORDERS', description, mappings, options, isDefault = false } = body;

    if (!name || !mappings) {
      return errorResponse('Preset name and mappings are required.', 400);
    }

    if (isDefault) {
      // Unset previous defaults
      await prisma.mappingPreset.updateMany({
        where: { module, isDefault: true },
        data: { isDefault: false },
      });
    }

    const preset = await prisma.mappingPreset.create({
      data: {
        name,
        module,
        description,
        mappings: JSON.stringify(mappings),
        options: options ? JSON.stringify(options) : null,
        isDefault,
        userId: user.id,
      },
    });

    return jsonResponse(
      {
        ...preset,
        mappings: JSON.parse(preset.mappings),
        options: preset.options ? JSON.parse(preset.options) : {},
      },
      201,
      'Mapping preset saved successfully'
    );
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to save preset', 500);
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return errorResponse('Preset ID is required.', 400);
    }

    await prisma.mappingPreset.delete({
      where: { id },
    });

    return jsonResponse({ message: 'Preset deleted successfully' });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete preset', 500);
  }
}
