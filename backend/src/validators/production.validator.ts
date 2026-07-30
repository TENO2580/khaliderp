import { z } from 'zod';

export const createProductionSchema = z.object({
  date: z.string().datetime(),
  batchId: z.string().min(1, 'Batch is required'),
  operatorId: z.string().min(1, 'Operator is required'),
  shift: z.enum(['DAY', 'NIGHT', 'MORNING', 'EVENING']).default('DAY'),
  waxUsed: z.number().min(0).default(0),
  fragranceUsed: z.number().min(0).default(0),
  colorUsed: z.number().min(0).default(0),
  containerUsed: z.number().min(0).default(0),
  wickUsed: z.number().min(0).default(0),
  labourCost: z.number().min(0).default(0),
  gasCost: z.number().min(0).default(0),
  electricityCost: z.number().min(0).default(0),
  otherCosts: z.number().min(0).default(0),
  quantityProduced: z.number().min(0).default(0),
  sellingPrice: z.number().min(0).default(0),
  notes: z.string().optional(),
});

export const createBatchSchema = z.object({
  productId: z.string().optional(),
  productionDate: z.string().datetime(),
  sellingPrice: z.number().min(0).default(0),
});

export type CreateProductionInput = z.infer<typeof createProductionSchema>;
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
