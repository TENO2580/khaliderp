import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        attendance: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!employee) {
      return errorResponse('Employee not found', 404);
    }

    return jsonResponse({ data: employee });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch employee', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      name, 
      phone, 
      designation, 
      department, 
      salary, 
      joinDate, 
      status, 
      address, 
      bankAccount, 
      ifscCode, 
      aadharNumber, 
      panNumber, 
      emergencyContact 
    } = body;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse('Employee not found', 404);
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(designation !== undefined && { designation }),
        ...(department !== undefined && { department }),
        ...(salary !== undefined && { salary: Number(salary) || 0 }),
        ...(joinDate !== undefined && { joinDate: joinDate ? new Date(joinDate) : existing.joinDate }),
        ...(status !== undefined && { status }),
        ...(address !== undefined && { address }),
        ...(bankAccount !== undefined && { bankAccount }),
        ...(ifscCode !== undefined && { ifscCode }),
        ...(aadharNumber !== undefined && { aadharNumber }),
        ...(panNumber !== undefined && { panNumber }),
        ...(emergencyContact !== undefined && { emergencyContact }),
      },
    });

    return jsonResponse(updated, 200, 'Employee updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update employee', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.employee.findUnique({ where: { id } });
      if (!existing) throw new Error('Employee not found');

      // Delete associated attendance records first
      await tx.attendance.deleteMany({ where: { employeeId: id } });
      await tx.employee.delete({ where: { id } });
    });

    return jsonResponse(null, 200, 'Employee deleted successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete employee', 400);
  }
}
