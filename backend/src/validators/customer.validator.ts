import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  gstNumber: z.string().optional(),
  address: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  type: z.enum(['DISTRIBUTOR', 'RETAILER', 'WHOLESALER', 'DEALER']).default('RETAILER'),
  currentBrand: z.string().optional(),
  sellingPrice: z.number().min(0).default(0),
  creditLimit: z.number().min(0).default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LEAD', 'LOST']).default('LEAD'),
  nextFollowupDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowupSchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(['CALL', 'VISIT', 'EMAIL', 'WHATSAPP', 'MEETING', 'OTHER']),
  notes: z.string().optional(),
  nextDate: z.string().datetime().optional(),
});

export const customerQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  state: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateFollowupInput = z.infer<typeof createFollowupSchema>;
