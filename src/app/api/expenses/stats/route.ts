import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  return jsonResponse({ data: { total: 0, average: 0, count: 0 } });
}
