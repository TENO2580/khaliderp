import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { authenticateRequest, jsonResponse, errorResponse } from '@/lib/middleware-server';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  const employees = await prisma.employee.findMany({
    orderBy: { name: 'asc' },
  });

  return jsonResponse({ data: employees });
}

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, phone, designation, department, salary, joinDate } = body;

    const count = await prisma.employee.count();
    const employeeId = `EMP-${String(count + 1).padStart(4, '0')}`;

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name,
        phone,
        designation,
        department,
        salary: Number(salary || 0),
        joinDate: joinDate ? new Date(joinDate) : new Date(),
      },
    });

    return jsonResponse(employee, 201, 'Employee created successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create employee', 400);
  }
}
