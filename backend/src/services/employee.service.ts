import prisma from '../config/database';
import { AppError } from '../middleware/error';
import { generateId } from '../utils/helpers';
import { PaginationParams, paginatedResponse } from '../utils/pagination';

export class EmployeeService {
  async getAll(params: PaginationParams, filters: { search?: string; status?: string; department?: string }) {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { employeeId: { contains: filters.search } },
        { phone: { contains: filters.search } },
      ];
    }
    if (filters.status) where.status = filters.status;
    if (filters.department) where.department = filters.department;

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: params.skip,
        take: params.limit,
      }),
      prisma.employee.count({ where }),
    ]);

    return paginatedResponse(data, total, params);
  }

  async getById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        attendance: { orderBy: { date: 'desc' }, take: 30 },
        user: { select: { id: true, email: true, role: true } },
      },
    });
    if (!employee) throw new AppError('Employee not found', 404);
    return employee;
  }

  async create(data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    designation?: string;
    department?: string;
    salary: number;
    joinDate: string;
    bankAccount?: string;
    ifscCode?: string;
    aadharNumber?: string;
    panNumber?: string;
    emergencyContact?: string;
  }) {
    const count = await prisma.employee.count();
    const employeeId = generateId('EMP', count + 1);

    return prisma.employee.create({
      data: {
        ...data,
        employeeId,
        joinDate: new Date(data.joinDate),
      },
    });
  }

  async update(id: string, data: any) {
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) throw new AppError('Employee not found', 404);

    return prisma.employee.update({
      where: { id },
      data: {
        ...data,
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
      },
    });
  }

  async markAttendance(data: {
    employeeId: string;
    date: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
    notes?: string;
  }) {
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new AppError('Employee not found', 404);

    const date = new Date(data.date);
    let hoursWorked: number | undefined;

    if (data.checkIn && data.checkOut) {
      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    }

    return prisma.attendance.upsert({
      where: {
        employeeId_date: { employeeId: data.employeeId, date },
      },
      update: {
        status: data.status as any,
        checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
        checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
        hoursWorked,
        notes: data.notes,
      },
      create: {
        employeeId: data.employeeId,
        date,
        status: data.status as any,
        checkIn: data.checkIn ? new Date(data.checkIn) : undefined,
        checkOut: data.checkOut ? new Date(data.checkOut) : undefined,
        hoursWorked,
        notes: data.notes,
      },
    });
  }

  async getAttendance(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getAttendanceStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalEmployees, todayAttendance] = await Promise.all([
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.attendance.findMany({
        where: { date: { gte: today, lt: tomorrow } },
      }),
    ]);

    const present = todayAttendance.filter((a: any) => a.status === 'PRESENT').length;
    const absent = todayAttendance.filter((a: any) => a.status === 'ABSENT').length;
    const onLeave = todayAttendance.filter((a: any) => a.status === 'ON_LEAVE').length;

    return {
      totalEmployees,
      present,
      absent,
      onLeave,
      attendanceRate: totalEmployees > 0 ? ((present / totalEmployees) * 100).toFixed(1) : '0',
    };
  }
}

export const employeeService = new EmployeeService();
