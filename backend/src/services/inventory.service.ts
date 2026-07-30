import prisma from '../config/database';
import { AppError } from '../middleware/error';
import { PaginationParams, paginatedResponse } from '../utils/pagination';

export class InventoryService {
  /**
   * Get finished goods inventory
   */
  async getAll(params: PaginationParams, filters: { search?: string; lowStock?: boolean }) {
    const where: any = {};
    if (filters.search) {
      where.product = { name: { contains: filters.search, mode: 'insensitive' } };
    }

    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        orderBy: { lastUpdated: 'desc' },
        skip: params.skip,
        take: params.limit,
        include: { product: true },
      }),
      prisma.inventory.count({ where }),
    ]);

    // Filter low stock in memory if needed (Prisma doesn't support computed field filters)
    const result = filters.lowStock
      ? data.filter((item: any) => item.currentStock <= item.reorderLevel)
      : data;

    return paginatedResponse(result, total, params);
  }

  /**
   * Get raw materials
   */
  async getRawMaterials(params: PaginationParams, filters: { search?: string; category?: string }) {
    const where: any = {};
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.category) where.category = filters.category;

    const [data, total] = await Promise.all([
      prisma.rawMaterial.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: params.skip,
        take: params.limit,
      }),
      prisma.rawMaterial.count({ where }),
    ]);

    return paginatedResponse(data, total, params);
  }

  /**
   * Create or update raw material
   */
  async upsertRawMaterial(data: {
    id?: string;
    name: string;
    category: string;
    unit?: string;
    currentStock?: number;
    minimumStock?: number;
    reorderLevel?: number;
    unitCost?: number;
  }) {
    if (data.id) {
      return prisma.rawMaterial.update({
        where: { id: data.id },
        data: {
          name: data.name,
          category: data.category as any,
          unit: data.unit,
          currentStock: data.currentStock,
          minimumStock: data.minimumStock,
          reorderLevel: data.reorderLevel,
          unitCost: data.unitCost,
        },
      });
    }

    return prisma.rawMaterial.create({
      data: {
        name: data.name,
        category: data.category as any,
        unit: data.unit || 'KG',
        currentStock: data.currentStock || 0,
        minimumStock: data.minimumStock || 0,
        reorderLevel: data.reorderLevel || 0,
        unitCost: data.unitCost || 0,
      },
    });
  }

  /**
   * Adjust stock manually
   */
  async adjustStock(data: {
    type: 'inventory' | 'rawMaterial';
    itemId: string;
    adjustment: number;
    reason: string;
    userId: string;
  }) {
    if (data.type === 'rawMaterial') {
      const material = await prisma.rawMaterial.findUnique({ where: { id: data.itemId } });
      if (!material) throw new AppError('Raw material not found', 404);

      await prisma.rawMaterial.update({
        where: { id: data.itemId },
        data: { currentStock: { increment: data.adjustment } },
      });

      await prisma.stockMovement.create({
        data: {
          rawMaterialId: data.itemId,
          type: 'ADJUSTMENT',
          quantity: data.adjustment,
          notes: data.reason,
          createdBy: data.userId,
        },
      });
    } else {
      const inventory = await prisma.inventory.findUnique({ where: { id: data.itemId } });
      if (!inventory) throw new AppError('Inventory item not found', 404);

      await prisma.inventory.update({
        where: { id: data.itemId },
        data: {
          currentStock: { increment: data.adjustment },
          lastUpdated: new Date(),
        },
      });

      await prisma.stockMovement.create({
        data: {
          inventoryId: data.itemId,
          type: 'ADJUSTMENT',
          quantity: data.adjustment,
          notes: data.reason,
          createdBy: data.userId,
        },
      });
    }
  }

  /**
   * Get stock movements history
   */
  async getStockMovements(params: PaginationParams, filters: {
    inventoryId?: string;
    rawMaterialId?: string;
    type?: string;
  }) {
    const where: any = {};
    if (filters.inventoryId) where.inventoryId = filters.inventoryId;
    if (filters.rawMaterialId) where.rawMaterialId = filters.rawMaterialId;
    if (filters.type) where.type = filters.type;

    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.limit,
        include: {
          inventory: { include: { product: true } },
          rawMaterial: true,
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return paginatedResponse(data, total, params);
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts() {
    const [lowRawMaterials, lowFinishedGoods] = await Promise.all([
      prisma.rawMaterial.findMany({
        where: {
          currentStock: { lte: prisma.rawMaterial.fields.reorderLevel as any },
        },
      }),
      prisma.inventory.findMany({
        where: {
          currentStock: { lte: 0 },
        },
        include: { product: true },
      }),
    ]);

    // Workaround: Filter in memory since Prisma doesn't support field-to-field comparison
    const allRaw = await prisma.rawMaterial.findMany();
    const lowRaw = allRaw.filter((m: any) => m.currentStock <= m.reorderLevel);

    const allInv = await prisma.inventory.findMany({ include: { product: true } });
    const lowInv = allInv.filter((i: any) => i.currentStock <= i.reorderLevel);

    return { rawMaterials: lowRaw, finishedGoods: lowInv };
  }

  /**
   * Get inventory statistics
   */
  async getStats() {
    const [rawMaterials, finishedGoods] = await Promise.all([
      prisma.rawMaterial.aggregate({ _sum: { currentStock: true } }),
      prisma.inventory.aggregate({ _sum: { currentStock: true, value: true } }),
    ]);

    const allRaw = await prisma.rawMaterial.findMany();
    const lowStockCount = allRaw.filter((m: any) => m.currentStock <= m.reorderLevel).length;

    return {
      totalRawMaterialStock: rawMaterials._sum.currentStock || 0,
      totalFinishedGoodsStock: finishedGoods._sum.currentStock || 0,
      totalInventoryValue: finishedGoods._sum.value || 0,
      lowStockAlerts: lowStockCount,
    };
  }
}

export const inventoryService = new InventoryService();
