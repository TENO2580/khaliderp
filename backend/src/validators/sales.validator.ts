import { z } from 'zod';

const salesOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  batchId: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  discount: z.number().min(0).default(0),
  gstRate: z.number().min(0).default(18),
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  deliveryDate: z.string().datetime().optional(),
  discount: z.number().min(0).default(0),
  transportCharge: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'CREDIT', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'NEFT', 'RTGS']).default('CREDIT'),
  notes: z.string().optional(),
  items: z.array(salesOrderItemSchema).min(1, 'At least one item is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED']),
});

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  customerId: z.string().min(1),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  method: z.enum(['CASH', 'CREDIT', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'NEFT', 'RTGS']),
  reference: z.string().optional(),
  date: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
