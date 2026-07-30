import { Request, Response } from 'express';
import { salesService } from '../services/sales.service';
import { successResponse, createdResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';

export class SalesController {
  async getAll(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req);
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        paymentStatus: req.query.paymentStatus as string,
        customerId: req.query.customerId as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
      };
      const result = await salesService.getAll(pagination, filters);
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const order = await salesService.getById(req.params.id as string);
      successResponse(res, order);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const order = await salesService.create(req.body, req.user!.id);
      createdResponse(res, order, 'Sales order created');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const order = await salesService.updateStatus(req.params.id as string, req.body.status);
      successResponse(res, order, 'Order status updated');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async generateInvoice(req: Request, res: Response) {
    try {
      const invoice = await salesService.generateInvoice(req.params.id as string);
      createdResponse(res, invoice, 'Invoice generated');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async recordPayment(req: Request, res: Response) {
    try {
      const payment = await salesService.recordPayment(req.body, req.user!.id);
      createdResponse(res, payment, 'Payment recorded');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const period = (req.query.period as 'today' | 'month' | 'year') || 'month';
      const stats = await salesService.getStats(period);
      successResponse(res, stats);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

export const salesController = new SalesController();
