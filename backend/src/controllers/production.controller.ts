import { Request, Response } from 'express';
import { productionService } from '../services/production.service';
import { successResponse, createdResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';

export class ProductionController {
  async getAll(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req);
      const filters = {
        search: req.query.search as string,
        batchId: req.query.batchId as string,
        operatorId: req.query.operatorId as string,
        fromDate: req.query.fromDate as string,
        toDate: req.query.toDate as string,
        shift: req.query.shift as string,
      };
      const result = await productionService.getAll(pagination, filters);
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const production = await productionService.getById(req.params.id as string);
      successResponse(res, production);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async create(req: Request, res: Response) {
    try {
      const production = await productionService.create(req.body);
      createdResponse(res, production, 'Production entry created');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await productionService.getStats();
      successResponse(res, stats);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  // Batch endpoints
  async createBatch(req: Request, res: Response) {
    try {
      const batch = await productionService.createBatch(req.body);
      createdResponse(res, batch, 'Batch created');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getAllBatches(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req);
      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
      };
      const result = await productionService.getAllBatches(pagination, filters);
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getBatchById(req: Request, res: Response) {
    try {
      const batch = await productionService.getBatchById(req.params.id as string);
      successResponse(res, batch);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

export const productionController = new ProductionController();
