import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';


const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ success: false, message: 'employeeId is required' }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json({ success: false, message: 'Employee not found' }, { status: 404 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        }
      }
    });

    const daysInMonth = endDate.getDate();
    const data = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month - 1, i);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const record = attendances.find(a => new Date(a.date).getTime() === dateObj.getTime());
      
      data.push({
        id: record?.id || `${dateStr}-${employee.name}`,
        date: dateStr,
        name: employee.name,
        isPresent: record ? record.status === 'PRESENT' : false,
        targetKg: record ? record.targetKg : 125,
        actualKg: record?.actualKg || 0,
        dailySalary: record ? record.dailySalary : 600,
        notes: record?.notes || '',
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Bulk attendance GET error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, records } = body;

    if (!employeeId || !records || !Array.isArray(records)) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    // Upsert all records
    for (const row of records) {
      const dateObj = new Date(row.date);
      
      await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: dateObj
          }
        },
        update: {
          status: row.isPresent ? 'PRESENT' : 'ABSENT',
          targetKg: row.targetKg,
          actualKg: row.actualKg,
          dailySalary: row.dailySalary,
          notes: row.notes,
        },
        create: {
          employeeId,
          date: dateObj,
          status: row.isPresent ? 'PRESENT' : 'ABSENT',
          targetKg: row.targetKg,
          actualKg: row.actualKg,
          dailySalary: row.dailySalary,
          notes: row.notes,
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Attendance records saved' });
  } catch (error: any) {
    console.error('Bulk attendance PUT error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
