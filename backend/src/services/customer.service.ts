import prisma from '../config/database';
import { AppError } from '../middleware/error';
import { CreateCustomerInput, UpdateCustomerInput, CreateFollowupInput } from '../validators/customer.validator';
import { generateId } from '../utils/helpers';
import { PaginationParams, paginatedResponse } from '../utils/pagination';

export class CustomerService {
  /**
   * Get all customers with pagination, search, filters
   */
  async getAll(params: PaginationParams, filters: {
    search?: string;
    status?: string;
    type?: string;
    state?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { ownerName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { customerId: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.state) where.state = { contains: filters.state, mode: 'insensitive' };

    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.limit,
        include: {
          _count: {
            select: { salesOrders: true, followups: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return paginatedResponse(data, total, params);
  }

  /**
   * Get a single customer by ID with related data
   */
  async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followups: { orderBy: { createdAt: 'desc' }, take: 20 },
        salesOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: { include: { product: true } } },
        },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: {
          select: { salesOrders: true, invoices: true, payments: true, followups: true },
        },
      },
    });

    if (!customer) throw new AppError('Customer not found', 404);
    return customer;
  }

  /**
   * Create a new customer with auto-generated ID
   */
  async create(data: CreateCustomerInput) {
    const count = await prisma.customer.count();
    const customerId = generateId('CUST', count + 1);

    const customer = await prisma.customer.create({
      data: {
        ...data,
        customerId,
        nextFollowupDate: data.nextFollowupDate ? new Date(data.nextFollowupDate) : undefined,
      },
    });

    return customer;
  }

  /**
   * Update an existing customer
   */
  async update(id: string, data: UpdateCustomerInput) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new AppError('Customer not found', 404);

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        nextFollowupDate: data.nextFollowupDate ? new Date(data.nextFollowupDate) : undefined,
      },
    });

    return customer;
  }

  /**
   * Delete a customer
   */
  async delete(id: string) {
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) throw new AppError('Customer not found', 404);

    await prisma.customer.delete({ where: { id } });
  }

  /**
   * Add a follow-up entry
   */
  async addFollowup(data: CreateFollowupInput) {
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new AppError('Customer not found', 404);

    const followup = await prisma.customerFollowup.create({
      data: {
        customerId: data.customerId,
        type: data.type as any,
        notes: data.notes,
        nextDate: data.nextDate ? new Date(data.nextDate) : undefined,
      },
    });

    // Update customer's next follow-up date
    if (data.nextDate) {
      await prisma.customer.update({
        where: { id: data.customerId },
        data: { nextFollowupDate: new Date(data.nextDate) },
      });
    }

    return followup;
  }

  /**
   * Get customers due for follow-up today or overdue
   */
  async getDueFollowups() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return prisma.customer.findMany({
      where: {
        nextFollowupDate: { lte: today },
        status: { in: ['ACTIVE', 'LEAD'] },
      },
      orderBy: { nextFollowupDate: 'asc' },
    });
  }

  /**
   * Get customer statistics
   */
  async getStats() {
    const [total, active, leads, totalOutstanding] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.customer.count({ where: { status: 'LEAD' } }),
      prisma.customer.aggregate({ _sum: { outstanding: true } }),
    ]);

    return {
      total,
      active,
      leads,
      inactive: total - active - leads,
      totalOutstanding: totalOutstanding._sum.outstanding || 0,
    };
  }
}

export const customerService = new CustomerService();
