import { Request, Response } from 'express';
import { employeeService } from '../services/employee.service';
import { successResponse, createdResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';

export class EmployeeController {
  async getAll(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req);
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        department: req.query.department as string,
      };
      const result = await employeeService.getAll(pagination, filters);
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const employee = await employeeService.getById(req.params.id as string);
      successResponse(res, employee);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const employee = await employeeService.create(req.body);
      createdResponse(res, employee, 'Employee created');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const employee = await employeeService.update(req.params.id as string, req.body);
      successResponse(res, employee, 'Employee updated');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async markAttendance(req: Request, res: Response) {
    try {
      const attendance = await employeeService.markAttendance(req.body);
      successResponse(res, attendance, 'Attendance marked');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getAttendance(req: Request, res: Response) {
    try {
      const employeeId = req.params.employeeId as string;
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const attendance = await employeeService.getAttendance(employeeId, month, year);
      successResponse(res, attendance);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getAttendanceStats(req: Request, res: Response) {
    try {
      const stats = await employeeService.getAttendanceStats();
      successResponse(res, stats);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

export const employeeController = new EmployeeController();
