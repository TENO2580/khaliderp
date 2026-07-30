import prisma from '../config/database';
import { AppError } from '../middleware/error';
import { PaginationParams, paginatedResponse } from '../utils/pagination';

export class ExpenseService {
  async getAll(params: PaginationParams, filters: {
    search?: string;
    categoryId?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};
    if (filters.search) {
      where.description = { contains: filters.search };
    }
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.status) where.status = filters.status;
    if (filters.fromDate || filters.toDate) {
      where.date = {};
      if (filters.fromDate) where.date.gte = new Date(filters.fromDate);
      if (filters.toDate) where.date.lte = new Date(filters.toDate);
    }

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: params.skip,
        take: params.limit,
        include: {
          category: true,
          createdBy: { select: { id: true, name: true } },
          approvedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return paginatedResponse(data, total, params);
  }

  async create(data: {
    categoryId: string;
    amount: number;
    date: string;
    description?: string;
    receiptUrl?: string;
    createdById: string;
  }) {
    return prisma.expense.create({
      data: {
        categoryId: data.categoryId,
        amount: data.amount,
        date: new Date(data.date),
        description: data.description,
        receiptUrl: data.receiptUrl,
        createdById: data.createdById,
      },
      include: { category: true },
    });
  }

  async approve(id: string, approvedById: string) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new AppError('Expense not found', 404);

    return prisma.expense.update({
      where: { id },
      data: { status: 'APPROVED', approvedById },
    });
  }

  async getCategories() {
    return prisma.expenseCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async getStats(period: 'month' | 'year' = 'month') {
    const now = new Date();
    const startDate = period === 'month'
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), 0, 1);

    const expenses = await prisma.expense.findMany({
      where: { date: { gte: startDate }, status: 'APPROVED' },
      include: { category: true },
    });

    const total = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);

    // Group by category
    const byCategory: Record<string, number> = {};
    expenses.forEach((e: any) => {
      const cat = e.category.name;
      byCategory[cat] = (byCategory[cat] || 0) + e.amount;
    });

    return {
      total,
      count: expenses.length,
      byCategory,
      average: expenses.length > 0 ? total / expenses.length : 0,
    };
  }
}

export const expenseService = new ExpenseService();
