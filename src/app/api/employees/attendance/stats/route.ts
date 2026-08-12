import { NextRequest } from 'next/server';
import { jsonResponse, authenticateRequest, errorResponse } from '@/lib/middleware-server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(req: NextRequest) {
  const { user, error } = await authenticateRequest(req);
  if (error) return error;

  try {
    // Get start and end of today in local timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalEmployees = await prisma.employee.count({
      where: { status: 'ACTIVE' },
    });

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const present = todayAttendance.filter((a) => a.status === 'PRESENT').length;
    const absent = todayAttendance.filter((a) => a.status === 'ABSENT').length;
    
    // Some might be half-day, leave, etc. If present is higher than totalEmployees (due to duplicate marks), cap it.
    const attendanceRate = totalEmployees > 0 
      ? Math.round((present / totalEmployees) * 100) 
      : 0;

    return jsonResponse({
      totalEmployees,
      present,
      absent,
      attendanceRate,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch attendance stats', 500);
  }
}
