import { NextRequest } from 'next/server';
import { jsonResponse, authenticateRequest, errorResponse } from '@/lib/middleware-server';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { employeeId, date, status } = body;

    if (!employeeId || !date || !status) {
      return errorResponse('Missing required fields', 400);
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Check if attendance already exists for this date
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: attendanceDate,
          lt: nextDay,
        }
      }
    });

    if (existing) {
      const updated = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status }
      });
      return jsonResponse(updated);
    } else {
      const created = await prisma.attendance.create({
        data: {
          employeeId,
          date: attendanceDate,
          status,
        }
      });
      return jsonResponse(created);
    }
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to mark attendance', 500);
  }
}
