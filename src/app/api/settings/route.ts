import { NextRequest } from 'next/server';
import { authenticateRequest, jsonResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  return jsonResponse({
    companyName: 'Lakshmi Candles',
    companyAddress: '124 Industrial Estate, Guindy, Chennai, Tamil Nadu 600032',
    companyGstin: '33AAAAA0000A1Z5',
    companyPhone: '+91 98765 43210',
    companyEmail: 'sales@lakshmicandles.com',
  });
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  return jsonResponse(null, 200, 'Company settings updated');
}
