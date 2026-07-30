import prisma from '../config/database';
import { AppError } from '../middleware/error';
import { CreateProductionInput, CreateBatchInput } from '../validators/production.validator';
import { generateDatedId } from '../utils/helpers';
import { PaginationParams, paginatedResponse } from '../utils/pagination';

export class ProductionService {
  /**
   * Get all production entries
   */
  async getAll(params: PaginationParams, filters: {
    search?: string;
    batchId?: string;
    operatorId?: string;
    fromDate?: string;
    toDate?: string;
    shift?: string;
  }) {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { productionNumber: { contains: filters.search } },
        { batch: { batchNumber: { contains: filters.search } } },
      ];
    }
    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.operatorId) where.operatorId = filters.operatorId;
    if (filters.shift) where.shift = filters.shift;
    if (filters.fromDate || filters.toDate) {
      where.date = {};
      if (filters.fromDate) where.date.gte = new Date(filters.fromDate);
      if (filters.toDate) where.date.lte = new Date(filters.toDate);
    }

    const [data, total] = await Promise.all([
      prisma.production.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: params.skip,
        take: params.limit,
        include: {
          batch: true,
          operator: { select: { id: true, name: true } },
        },
      }),
      prisma.production.count({ where }),
    ]);

    return paginatedResponse(data, total, params);
  }

  /**
   * Get production entry by ID
   */
  async getById(id: string) {
    const production = await prisma.production.findUnique({
      where: { id },
      include: {
        batch: { include: { product: true } },
        operator: { select: { id: true, name: true, email: true } },
      },
    });
    if (!production) throw new AppError('Production entry not found', 404);
    return production;
  }

  /**
   * Create production entry with auto-calculations:
   * - Auto-calculate total cost, cost/kg, profit, margin
   * - Auto-deduct raw materials from inventory
   * - Auto-increase finished goods stock
   * - Auto-update batch quantities
   */
  async create(data: CreateProductionInput) {
    // Verify batch exists
    const batch = await prisma.batch.findUnique({ where: { id: data.batchId } });
    if (!batch) throw new AppError('Batch not found', 404);

    // Generate production number
    const year = new Date().getFullYear();
    const count = await prisma.production.count({
      where: { date: { gte: new Date(`${year}-01-01`) } },
    });
    const productionNumber = generateDatedId('PROD', year, count + 1);

    // Auto-calculate costs
    const totalCost = data.labourCost + data.gasCost + data.electricityCost + data.otherCosts;
    const costPerKg = data.quantityProduced > 0 ? totalCost / data.quantityProduced : 0;
    const revenue = data.quantityProduced * data.sellingPrice;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Create the production entry
    const production = await prisma.production.create({
      data: {
        productionNumber,
        date: new Date(data.date),
        batchId: data.batchId,
        operatorId: data.operatorId,
        shift: data.shift as any,
        waxUsed: data.waxUsed,
        fragranceUsed: data.fragranceUsed,
        colorUsed: data.colorUsed,
        containerUsed: data.containerUsed,
        wickUsed: data.wickUsed,
        labourCost: data.labourCost,
        gasCost: data.gasCost,
        electricityCost: data.electricityCost,
        otherCosts: data.otherCosts,
        totalCost,
        quantityProduced: data.quantityProduced,
        costPerKg,
        sellingPrice: data.sellingPrice,
        profit,
        margin,
        notes: data.notes,
      },
      include: { batch: true, operator: { select: { id: true, name: true } } },
    });

    // Auto-deduct raw materials
    const materialDeductions = [
      { category: 'WAX', quantity: data.waxUsed },
      { category: 'FRAGRANCE', quantity: data.fragranceUsed },
      { category: 'COLOR', quantity: data.colorUsed },
      { category: 'CONTAINER', quantity: data.containerUsed },
      { category: 'WICK', quantity: data.wickUsed },
    ];

    for (const deduction of materialDeductions) {
      if (deduction.quantity > 0) {
        const material = await prisma.rawMaterial.findFirst({
          where: { category: deduction.category as any },
        });

        if (material) {
          await prisma.rawMaterial.update({
            where: { id: material.id },
            data: { currentStock: { decrement: deduction.quantity } },
          });

          // Record stock movement
          await prisma.stockMovement.create({
            data: {
              rawMaterialId: material.id,
              type: 'PRODUCTION_OUT',
              quantity: deduction.quantity,
              reference: `Production ${productionNumber}`,
              referenceId: production.id,
              notes: `Consumed in production ${productionNumber}`,
            },
          });
        }
      }
    }

    // Auto-update batch
    await prisma.batch.update({
      where: { id: data.batchId },
      data: {
        producedQty: { increment: data.quantityProduced },
        remainingQty: { increment: data.quantityProduced },
        waxUsed: { increment: data.waxUsed },
        productionCost: { increment: totalCost },
        sellingPrice: data.sellingPrice,
        costPerKg,
        status: 'COMPLETED',
      },
    });

    // Auto-increase finished goods inventory (if product linked to batch)
    if (batch.productId) {
      const inventory = await prisma.inventory.findUnique({
        where: { productId: batch.productId },
      });

      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            currentStock: { increment: data.quantityProduced },
            value: { increment: data.quantityProduced * costPerKg },
            lastUpdated: new Date(),
          },
        });

        await prisma.stockMovement.create({
          data: {
            inventoryId: inventory.id,
            type: 'PRODUCTION_IN',
            quantity: data.quantityProduced,
            reference: `Production ${productionNumber}`,
            referenceId: production.id,
            notes: `Finished goods from production ${productionNumber}`,
          },
        });
      }
    }

    return production;
  }

  /**
   * Get production stats for dashboard
   */
  async getStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayProduction, monthProduction] = await Promise.all([
      prisma.production.aggregate({
        where: { date: { gte: startOfDay } },
        _sum: { quantityProduced: true, totalCost: true, profit: true },
        _count: true,
      }),
      prisma.production.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { quantityProduced: true, totalCost: true, profit: true },
        _count: true,
      }),
    ]);

    return {
      today: {
        quantity: todayProduction._sum.quantityProduced || 0,
        cost: todayProduction._sum.totalCost || 0,
        profit: todayProduction._sum.profit || 0,
        entries: todayProduction._count,
      },
      month: {
        quantity: monthProduction._sum.quantityProduced || 0,
        cost: monthProduction._sum.totalCost || 0,
        profit: monthProduction._sum.profit || 0,
        entries: monthProduction._count,
      },
    };
  }

  // ─── Batch Operations ───

  /**
   * Create a new batch
   */
  async createBatch(data: CreateBatchInput) {
    const year = new Date().getFullYear();
    const count = await prisma.batch.count({
      where: { productionDate: { gte: new Date(`${year}-01-01`) } },
    });
    const batchNumber = generateDatedId('BATCH', year, count + 1);

    return prisma.batch.create({
      data: {
        batchNumber,
        productId: data.productId,
        productionDate: new Date(data.productionDate),
        sellingPrice: data.sellingPrice,
      },
    });
  }

  /**
   * Get all batches
   */
  async getAllBatches(params: PaginationParams, filters: { search?: string; status?: string }) {
    const where: any = {};
    if (filters.search) {
      where.batchNumber = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        orderBy: { productionDate: 'desc' },
        skip: params.skip,
        take: params.limit,
        include: {
          product: true,
          _count: { select: { productions: true, salesOrderItems: true } },
        },
      }),
      prisma.batch.count({ where }),
    ]);

    return paginatedResponse(data, total, params);
  }

  /**
   * Get batch by ID with full history
   */
  async getBatchById(id: string) {
    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        product: true,
        productions: {
          orderBy: { date: 'desc' },
          include: { operator: { select: { id: true, name: true } } },
        },
        salesOrderItems: {
          include: {
            order: { include: { customer: { select: { id: true, name: true } } } },
            product: true,
          },
        },
      },
    });
    if (!batch) throw new AppError('Batch not found', 404);
    return batch;
  }
}

export const productionService = new ProductionService();
