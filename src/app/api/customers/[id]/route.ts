import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    
    // Remove fields that shouldn't be updated directly via this generic endpoint
    delete body.id;
    delete body.customerId;
    delete body.createdAt;
    delete body.updatedAt;

    const customer = await prisma.customer.update({
      where: { id },
      data: body,
    });

    return jsonResponse(customer, 200, 'Customer updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update customer', 400);
  }
}
