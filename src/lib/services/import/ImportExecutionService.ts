import prisma from '@/lib/db';
import { ValidatedRow } from './DataValidationService';
import { BatchResolutionService, BatchResolutionOption } from './BatchResolutionService';
import { logActivity } from '@/lib/activity-logger';

export interface ImportExecutionParams {
  validatedRows: ValidatedRow[];
  mode: 'ADD_NEW' | 'UPDATE_EXISTING' | 'ADD_AND_UPDATE';
  batchResolutions?: Record<string, BatchResolutionOption>;
  fileName: string;
  fileSize?: number;
  mappingUsed: Record<string, string>;
  options?: {
    calculationMode?: string;
  };
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export interface ImportExecutionResult {
  importId: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  rowResults: {
    rowIndex: number;
    customerName: string;
    action: 'CREATED' | 'UPDATED' | 'SKIPPED' | 'FAILED';
    orderNumber?: string;
    error?: string;
  }[];
}

export class ImportExecutionService {
  /**
   * Execute bulk import safely in transactional batches
   */
  static async executeImport(params: ImportExecutionParams): Promise<ImportExecutionResult> {
    const { validatedRows, mode, batchResolutions = {}, fileName, fileSize, mappingUsed, options, user } = params;

    // 1. Generate unique Import ID
    const historyCount = await prisma.importHistory.count();
    const importId = `IMP-2026-${String(historyCount + 1).padStart(4, '0')}`;

    // 2. Resolve batches
    const resolvedBatchMap = await BatchResolutionService.applyBatchResolutions(batchResolutions, user?.id);

    // Also get all DB batches for fast lookup
    const allDbBatches = await prisma.batch.findMany({
      select: { id: true, batchNumber: true, remainingQty: true },
    });
    const batchLookup = new Map<string, { id: string; batchNumber: string }>();
    for (const b of allDbBatches) {
      batchLookup.set(b.batchNumber.toUpperCase().trim(), b);
    }

    // 3. Pre-fetch default product or products
    const defaultProduct = await prisma.product.findFirst();
    const allProducts = await prisma.product.findMany();

    // 4. Pre-fetch / prepare customers
    const customerNameMap = new Map<string, string>(); // name.toLowerCase() -> customerId
    const existingCustomers = await prisma.customer.findMany({
      select: { id: true, name: true },
    });
    for (const c of existingCustomers) {
      customerNameMap.set(c.name.toLowerCase().trim(), c.id);
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const rowResults: ImportExecutionResult['rowResults'] = [];
    const errorRecords: any[] = [];
    const importedSampleRows: any[] = [];

    // Filter valid rows only (failed validation rows recorded as FAILED)
    const validRowsToProcess: ValidatedRow[] = [];
    for (const row of validatedRows) {
      if (!row.isValid) {
        failedCount++;
        rowResults.push({
          rowIndex: row.rowIndex,
          customerName: row.normalizedData.customerName || 'Unknown',
          action: 'FAILED',
          error: row.errors.map((e) => `${e.field}: ${e.message}`).join('; '),
        });
        errorRecords.push({
          row: row.rowIndex,
          customer: row.normalizedData.customerName,
          data: row.rawRow,
          errors: row.errors,
          suggestedFix: row.errors.map((e) => e.suggestedFix).filter(Boolean).join('; '),
        });
      } else {
        validRowsToProcess.push(row);
      }
    }

    // 5. Process in chunks of 50
    const CHUNK_SIZE = 50;
    for (let i = 0; i < validRowsToProcess.length; i += CHUNK_SIZE) {
      const chunk = validRowsToProcess.slice(i, i + CHUNK_SIZE);

      await prisma.$transaction(async (tx) => {
        for (const row of chunk) {
          try {
            const {
              customerName,
              batchUsed,
              orderDate,
              deliveryDate,
              type,
              quantity,
              productionCost,
              sellingCost,
              marginPct,
              marginAmount,
              totalSellingCost,
              status,
              unmappedFields,
            } = row.normalizedData;

            // Resolve / Create Customer
            const custKey = customerName.toLowerCase().trim();
            let customerId = customerNameMap.get(custKey);
            if (!customerId) {
              const custCount = await tx.customer.count();
              const customerIdCode = `CUST-${String(custCount + 1).padStart(4, '0')}`;
              const newCustomer = await tx.customer.create({
                data: {
                  customerId: customerIdCode,
                  name: customerName,
                  notes: 'Created automatically during Order Import',
                },
              });
              customerId = newCustomer.id;
              customerNameMap.set(custKey, customerId);
            }

            // Find matching product by type
            const matchedProduct = allProducts.find((p) =>
              p.name.toLowerCase().includes(type.toLowerCase()) || type.toLowerCase().includes(p.name.toLowerCase())
            ) || defaultProduct;
            const productId = matchedProduct?.id || '';

            // Handle Batch references
            const batchNames = BatchResolutionService.splitBatchNames(batchUsed);
            const batchIds: string[] = [];
            const finalBatchDisplayNames: string[] = [];

            for (const bName of batchNames) {
              const resolved = resolvedBatchMap[bName];
              if (resolved?.batchId) {
                batchIds.push(resolved.batchId);
                finalBatchDisplayNames.push(resolved.batchNumber);
              } else {
                const dbMatch = batchLookup.get(bName.toUpperCase().trim());
                if (dbMatch) {
                  batchIds.push(dbMatch.id);
                  finalBatchDisplayNames.push(dbMatch.batchNumber);
                } else {
                  finalBatchDisplayNames.push(bName);
                }
              }
            }

            const batchDisplayStr = finalBatchDisplayNames.length > 0 ? finalBatchDisplayNames.join(', ') : batchUsed;

            // Notes metadata
            const notesObj = {
              type,
              productId,
              weightPerUnit: 1,
              quantityUnits: quantity,
              totalWeightKg: quantity,
              productionCostPerKg: quantity > 0 ? (productionCost / quantity).toFixed(2) : '0',
              productionCost: productionCost.toFixed(2),
              unitSellingPrice: quantity > 0 ? (sellingCost / quantity).toFixed(2) : sellingCost.toFixed(2),
              sellingCost: (totalSellingCost || sellingCost).toFixed(2),
              profitAmt: marginAmount,
              margin: `${marginPct}% (\u20b9${marginAmount.toFixed(2)})`,
              batchUsed: batchDisplayStr,
              importedFrom: fileName,
              importId,
              unmappedFields,
            };

            const orderDateObj = new Date(orderDate);
            const deliveryDateObj = deliveryDate ? new Date(deliveryDate) : null;

            // DUPLICATE HANDLING & IMPORT MODES
            if (row.isDuplicate) {
              if (mode === 'ADD_NEW') {
                // Skip duplicate
                skippedCount++;
                rowResults.push({
                  rowIndex: row.rowIndex,
                  customerName,
                  action: 'SKIPPED',
                  error: 'Duplicate detected - skipped in Add New mode',
                });
                continue;
              } else if (mode === 'UPDATE_EXISTING' || mode === 'ADD_AND_UPDATE') {
                // Find existing order
                const existingOrder = await tx.salesOrder.findFirst({
                  where: {
                    customerId,
                    orderDate: orderDateObj,
                  },
                });

                if (existingOrder) {
                  await tx.salesOrder.update({
                    where: { id: existingOrder.id },
                    data: {
                      deliveryDate: deliveryDateObj,
                      totalAmount: totalSellingCost || sellingCost,
                      status: status as any,
                      notes: JSON.stringify(notesObj),
                    },
                  });

                  // Update or recreate order item
                  await tx.salesOrderItem.deleteMany({
                    where: { orderId: existingOrder.id },
                  });

                  if (productId) {
                    await tx.salesOrderItem.create({
                      data: {
                        orderId: existingOrder.id,
                        productId,
                        batchId: batchIds[0] || null,
                        quantity,
                        unitPrice: quantity > 0 ? totalSellingCost / quantity : totalSellingCost,
                        amount: totalSellingCost || sellingCost,
                      },
                    });
                  }

                  updatedCount++;
                  rowResults.push({
                    rowIndex: row.rowIndex,
                    customerName,
                    orderNumber: existingOrder.orderNumber,
                    action: 'UPDATED',
                  });
                  continue;
                }
              }
            }

            if (mode === 'UPDATE_EXISTING') {
              // Row does not exist in UPDATE_EXISTING mode -> Skip
              skippedCount++;
              rowResults.push({
                rowIndex: row.rowIndex,
                customerName,
                action: 'SKIPPED',
                error: 'Order does not exist in database',
              });
              continue;
            }

            // CREATE NEW SALES ORDER
            const count = await tx.salesOrder.count();
            const orderNumber = `SO-2026-${String(count + 1).padStart(4, '0')}`;

            const createdOrder = await tx.salesOrder.create({
              data: {
                orderNumber,
                customerId,
                orderDate: orderDateObj,
                deliveryDate: deliveryDateObj,
                subtotal: totalSellingCost || sellingCost,
                totalAmount: totalSellingCost || sellingCost,
                status: status as any,
                notes: JSON.stringify(notesObj),
                createdBy: user?.name || user?.email || 'System Import',
              },
            });

            // Create Order Item
            if (productId) {
              await tx.salesOrderItem.create({
                data: {
                  orderId: createdOrder.id,
                  productId,
                  batchId: batchIds[0] || null,
                  quantity,
                  unitPrice: quantity > 0 ? totalSellingCost / quantity : totalSellingCost,
                  amount: totalSellingCost || sellingCost,
                },
              });
            }

            createdCount++;
            rowResults.push({
              rowIndex: row.rowIndex,
              customerName,
              orderNumber,
              action: 'CREATED',
            });

            if (importedSampleRows.length < 15) {
              importedSampleRows.push({
                row: row.rowIndex,
                orderNumber,
                customerName,
                orderDate,
                type,
                quantity,
                totalAmount: totalSellingCost || sellingCost,
                status,
              });
            }
          } catch (err: any) {
            failedCount++;
            rowResults.push({
              rowIndex: row.rowIndex,
              customerName: row.normalizedData.customerName || 'Unknown',
              action: 'FAILED',
              error: err.message || 'Database error during insertion',
            });
            errorRecords.push({
              row: row.rowIndex,
              customer: row.normalizedData.customerName,
              data: row.rawRow,
              errors: [{ field: 'Database', message: err.message || 'Insertion failed' }],
            });
          }
        }
      });
    }

    const overallStatus = failedCount === 0 ? 'COMPLETED' : createdCount + updatedCount > 0 ? 'PARTIAL' : 'FAILED';

    // 6. Record in ImportHistory
    await prisma.importHistory.create({
      data: {
        importId,
        module: 'ORDERS',
        fileName,
        fileSize: fileSize || 0,
        status: overallStatus,
        totalRows: validatedRows.length,
        createdCount,
        updatedCount,
        skippedCount,
        failedCount,
        mode,
        mappingUsed: JSON.stringify(mappingUsed),
        summary: JSON.stringify({
          createdCount,
          updatedCount,
          skippedCount,
          failedCount,
          totalRows: validatedRows.length,
          options,
        }),
        errors: JSON.stringify(errorRecords),
        importedData: JSON.stringify(importedSampleRows),
        userId: user?.id,
        userName: user?.name || user?.email || 'User',
      },
    });

    // 7. Log Activity
    try {
      await prisma.activityLog.create({
        data: {
          module: 'Sales',
          action: 'CREATE',
          title: `Bulk Imported ${createdCount + updatedCount} Orders (${importId})`,
          description: `File: ${fileName} | Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`,
          userId: user?.id,
          iconType: 'file-text',
          iconColor: '#22C55E',
          priority: failedCount > 0 ? 'normal' : 'low',
        },
      });
    } catch (e) {}

    return {
      importId,
      status: overallStatus,
      totalRows: validatedRows.length,
      createdCount,
      updatedCount,
      skippedCount,
      failedCount,
      rowResults,
    };
  }
}
