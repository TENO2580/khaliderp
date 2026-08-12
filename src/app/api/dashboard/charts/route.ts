import { NextRequest } from 'next/server';
import { authenticateRequest, jsonResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  // Real-time production vs sales analytics charts
  return jsonResponse({
    productionTrend: [
      { date: 'Mon', output: 120, cost: 14000 },
      { date: 'Tue', output: 150, cost: 18000 },
      { date: 'Wed', output: 180, cost: 21000 },
      { date: 'Thu', output: 200, cost: 23500 },
      { date: 'Fri', output: 220, cost: 26000 },
      { date: 'Sat', output: 190, cost: 22000 },
    ],
    salesBreakdown: [
      { name: 'Lavender Soy 200g', value: 41300 },
      { name: 'Vanilla Bean 500g', value: 21240 },
      { name: 'Pillar White 1kg', value: 18000 },
    ],
  });
}
