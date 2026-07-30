import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { successResponse, errorResponse } from '../utils/response';

export class DashboardController {
  async getKPIs(req: Request, res: Response) {
    try {
      const kpis = await dashboardService.getKPIs();
      successResponse(res, kpis);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  async getChartData(req: Request, res: Response) {
    try {
      const charts = await dashboardService.getChartData();
      successResponse(res, charts);
    } catch (error: any) {
      errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

export const dashboardController = new DashboardController();
