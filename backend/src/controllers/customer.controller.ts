import { Request, Response } from 'express';
import { customerService } from '../services/customer.service';
import { successResponse, createdResponse, errorResponse, noContentResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';

export class CustomerController {
  async getAll(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req);
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        type: req.query.type as string,
        state: req.query.state as string,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };
      const result = await customerService.getAll(pagination, filters);
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const customer = await customerService.getById(req.params.id as string);
      successResponse(res, customer);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const customer = await customerService.create(req.body);
      createdResponse(res, customer, 'Customer created successfully');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async update(req: Request, res: Response) {
    try {
      const customer = await customerService.update(req.params.id as string, req.body);
      successResponse(res, customer, 'Customer updated successfully');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await customerService.delete(req.params.id as string);
      noContentResponse(res);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async addFollowup(req: Request, res: Response) {
    try {
      const followup = await customerService.addFollowup(req.body);
      createdResponse(res, followup, 'Follow-up added');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getDueFollowups(req: Request, res: Response) {
    try {
      const customers = await customerService.getDueFollowups();
      successResponse(res, customers);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await customerService.getStats();
      successResponse(res, stats);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

export const customerController = new CustomerController();
