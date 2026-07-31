import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/middleware-server';

export async function GET(req: NextRequest) {
  return jsonResponse({ data: { totalEmployees: 0, present: 0, absent: 0, attendanceRate: 100 } });
}
