import { Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { successResponse, createdResponse, errorResponse } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';

export class InventoryController {
  async getAll(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req);
      const filters = {
        search: req.query.search as string,
        lowStock: req.query.lowStock === 'true',
      };
      const result = await inventoryService.getAll(pagination, filters);
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getRawMaterials(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req);
      const filters = {
        search: req.query.search as string,
        category: req.query.category as string,
      };
      const result = await inventoryService.getRawMaterials(pagination, filters);
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async upsertRawMaterial(req: Request, res: Response) {
    try {
      const material = await inventoryService.upsertRawMaterial(req.body);
      createdResponse(res, material);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async adjustStock(req: Request, res: Response) {
    try {
      await inventoryService.adjustStock({ ...req.body, userId: req.user!.id });
      successResponse(res, null, 'Stock adjusted');
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getStockMovements(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req);
      const filters = {
        inventoryId: req.query.inventoryId as string,
        rawMaterialId: req.query.rawMaterialId as string,
        type: req.query.type as string,
      };
      const result = await inventoryService.getStockMovements(pagination, filters);
      successResponse(res, result);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getLowStockAlerts(req: Request, res: Response) {
    try {
      const alerts = await inventoryService.getLowStockAlerts();
      successResponse(res, alerts);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await inventoryService.getStats();
      successResponse(res, stats);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

export const inventoryController = new InventoryController();
