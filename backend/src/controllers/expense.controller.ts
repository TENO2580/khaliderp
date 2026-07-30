import { Request, Response } from 'express';
import { expenseService } from '../services/expense.service';
import { successResponse, createdResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';

export class ExpenseController {
  async getAll(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req);
      const filters = {
        search: req.query.search as string,
        categoryId: req.query.categoryId as string,
        status: req.query.status as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
      };
      const result = await expenseService.getAll(pagination, filters);
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const expense = await expenseService.create({ ...req.body, createdById: req.user!.id });
      createdResponse(res, expense, 'Expense recorded');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async approve(req: Request, res: Response) {
    try {
      const expense = await expenseService.approve(req.params.id as string, req.user!.id);
      successResponse(res, expense, 'Expense approved');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await expenseService.getCategories();
      successResponse(res, categories);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const period = (req.query.period as 'month' | 'year') || 'month';
      const stats = await expenseService.getStats(period);
      successResponse(res, stats);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

export const expenseController = new ExpenseController();
