import prisma from '../config/database';
import { AppError } from '../middleware/error';
import { CreateSalesOrderInput, CreatePaymentInput } from '../validators/sales.validator';
import { generateDatedId, calculateGST } from '../utils/helpers';
import { PaginationParams, paginatedResponse } from '../utils/pagination';

export class SalesService {
  /**
   * Get all sales orders with pagination and filters
   */
  async getAll(params: PaginationParams, filters: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    customerId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search } },
        { customer: { name: { contains: filters.search } } },
      ];
    }
    if (filters.status) where.status = filters.status;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.fromDate || filters.toDate) {
      where.orderDate = {};
      if (filters.fromDate) where.orderDate.gte = new Date(filters.fromDate);
      if (filters.toDate) where.orderDate.lte = new Date(filters.toDate);
    }

    const [data, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.limit,
        include: {
          customer: { select: { id: true, name: true, customerId: true, phone: true } },
          items: { include: { product: true, batch: true } },
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
        },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return paginatedResponse(data, total, params);
  }

  /**
   * Get single sales order by ID
   */
  async getById(id: string) {
    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true, batch: true } },
        invoice: { include: { items: true, payments: true } },
      },
    });
    if (!order) throw new AppError('Sales order not found', 404);
    return order;
  }

  /**
   * Create a new sales order with line items
   * Auto-calculates subtotal, GST, total, outstanding
   */
  async create(data: CreateSalesOrderInput, userId: string) {
    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new AppError('Customer not found', 404);

    // Generate order number
    const year = new Date().getFullYear();
    const count = await prisma.salesOrder.count({
      where: { orderDate: { gte: new Date(`${year}-01-01`) } },
    });
    const orderNumber = generateDatedId('SO', year, count + 1);

    // Determine if inter-state (compare customer state with company state)
    const companySetting = await prisma.setting.findUnique({ where: { key: 'company_state' } });
    const companyState = companySetting?.value || 'Tamil Nadu';
    const isInterState = customer.state ? customer.state !== companyState : false;

    // Calculate line item amounts
    let subtotal = 0;
    const processedItems = data.items.map((item: any) => {
      const lineAmount = item.quantity * item.unitPrice - item.discount;
      const gst = calculateGST(lineAmount, item.gstRate, isInterState);
      subtotal += lineAmount;

      return {
        productId: item.productId,
        batchId: item.batchId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        gstRate: item.gstRate,
        gstAmount: gst.totalGst,
        amount: lineAmount + gst.totalGst,
      };
    });

    // Calculate order totals
    const taxableAmount = subtotal - data.discount;
    const orderGst = calculateGST(taxableAmount, 18, isInterState); // default GST for order level
    const totalGst = processedItems.reduce((sum: number, item: any) => sum + item.gstAmount, 0);
    const totalAmount = subtotal - data.discount + totalGst + data.transportCharge;

    const order = await prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
        subtotal,
        discount: data.discount,
        taxableAmount,
        cgst: orderGst.cgst,
        sgst: orderGst.sgst,
        igst: orderGst.igst,
        totalGst,
        transportCharge: data.transportCharge,
        totalAmount,
        paymentMethod: data.paymentMethod as any,
        outstanding: data.paymentMethod === 'CREDIT' ? totalAmount : 0,
        creditAmount: data.paymentMethod === 'CREDIT' ? totalAmount : 0,
        notes: data.notes,
        createdBy: userId,
        items: { create: processedItems },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    // Update customer outstanding if credit sale
    if (data.paymentMethod === 'CREDIT') {
      await prisma.customer.update({
        where: { id: data.customerId },
        data: {
          outstanding: { increment: totalAmount },
          lastPurchaseDate: new Date(),
          status: 'ACTIVE',
        },
      });
    } else {
      await prisma.customer.update({
        where: { id: data.customerId },
        data: { lastPurchaseDate: new Date(), status: 'ACTIVE' },
      });
    }

    return order;
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, status: string) {
    const order = await prisma.salesOrder.findUnique({ where: { id } });
    if (!order) throw new AppError('Sales order not found', 404);

    return prisma.salesOrder.update({
      where: { id },
      data: { status: status as any },
    });
  }

  /**
   * Generate invoice from sales order
   */
  async generateInvoice(orderId: string) {
    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } }, invoice: true },
    });

    if (!order) throw new AppError('Sales order not found', 404);
    if (order.invoice) throw new AppError('Invoice already exists for this order', 409);

    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: { invoiceDate: { gte: new Date(`${year}-01-01`) } },
    });
    const invoiceNumber = generateDatedId('INV', year, count + 1);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        customerId: order.customerId,
        subtotal: order.subtotal,
        cgst: order.cgst,
        sgst: order.sgst,
        igst: order.igst,
        totalGst: order.totalGst,
        transportCharge: order.transportCharge,
        totalAmount: order.totalAmount,
        outstanding: order.outstanding,
        items: {
          create: order.items.map((item: any) => ({
            productId: item.productId,
            description: item.product.name,
            hsnCode: item.product.hsnCode || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxableAmount: item.quantity * item.unitPrice - item.discount,
            gstRate: item.gstRate,
            cgst: item.gstAmount / 2,
            sgst: item.gstAmount / 2,
            igst: 0,
            amount: item.amount,
          })),
        },
      },
      include: { items: true, customer: true, order: true },
    });

    return invoice;
  }

  /**
   * Record a payment against an invoice
   */
  async recordPayment(data: CreatePaymentInput, userId: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
    if (!invoice) throw new AppError('Invoice not found', 404);

    if (data.amount > invoice.outstanding) {
      throw new AppError('Payment amount exceeds outstanding balance', 400);
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        customerId: data.customerId,
        amount: data.amount,
        method: data.method as any,
        reference: data.reference,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes,
        createdBy: userId,
      },
    });

    // Update invoice outstanding
    const newOutstanding = invoice.outstanding - data.amount;
    const newPaid = invoice.paidAmount + data.amount;
    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: newPaid,
        outstanding: newOutstanding,
        status: newOutstanding <= 0 ? 'PAID' : 'PARTIAL',
      },
    });

    // Update sales order
    await prisma.salesOrder.update({
      where: { id: invoice.orderId },
      data: {
        paidAmount: newPaid,
        outstanding: newOutstanding,
        paymentStatus: newOutstanding <= 0 ? 'PAID' : 'PARTIAL',
      },
    });

    // Update customer outstanding
    await prisma.customer.update({
      where: { id: data.customerId },
      data: { outstanding: { decrement: data.amount } },
    });

    return payment;
  }

  /**
   * Get sales statistics for dashboard
   */
  async getStats(period: 'today' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const orders = await prisma.salesOrder.findMany({
      where: {
        orderDate: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
    });

    const totalSales = orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o: any) => o.paymentStatus === 'PAID');
    const pendingOrders = orders.filter((o: any) => o.status === 'PENDING').length;
    const deliveredOrders = orders.filter((o: any) => o.status === 'DELIVERED').length;
    const totalOutstanding = orders.reduce((sum: number, o: any) => sum + o.outstanding, 0);

    return {
      totalSales,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalOutstanding,
      averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
    };
  }
}

export const salesService = new SalesService();
