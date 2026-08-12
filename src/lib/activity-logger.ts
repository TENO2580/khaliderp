import { PrismaClient } from '@prisma/client';

/**
 * Intercepts Prisma operations and logs them to the ActivityLog table.
 */
export async function logActivity(
  prisma: any,
  model: string,
  operation: string,
  args: any,
  result: any
) {
  // Only log specific operations
  if (!['create', 'update', 'delete'].includes(operation)) {
    return;
  }

  // Define which models we care about logging
  const loggedModels = [
    'SalesOrder',
    'Invoice',
    'Customer',
    'Supplier',
    'Product',
    'Inventory',
    'StockMovement',
    'PurchaseOrder',
    'Production',
    'Payment',
    'Expense',
    'User',
    'Employee',
    'Attendance',
    'Batch',
  ];

  if (!loggedModels.includes(model)) {
    return;
  }

  try {
    let module = model;
    let title = `${model} ${operation}d`;
    let iconType = 'info';
    let iconColor = '#9CA3AF'; // default gray
    let priority = 'normal';
    let referenceId = result?.id || '';
    let deepLink = '';
    
    // Map operation to generic action
    const actionMap: Record<string, string> = {
      create: 'CREATED',
      update: 'UPDATED',
      delete: 'DELETED'
    };
    const action = actionMap[operation] || operation.toUpperCase();

    // Custom formatting based on model
    switch (model) {
      case 'SalesOrder':
        module = 'Sales';
        referenceId = result.orderNumber || result.id;
        title = `Sales Order ${referenceId} ${operation}d`;
        iconType = 'shopping-cart';
        iconColor = operation === 'create' ? '#22C55E' : (operation === 'delete' ? '#EF4444' : '#3B82F6');
        deepLink = `/sales/orders/${result.id}`;
        if (result.status === 'CONFIRMED' || result.status === 'DELIVERED') {
          title = `Sales Order ${referenceId} ${result.status.toLowerCase()}`;
          priority = 'high';
        }
        break;

      case 'Invoice':
        module = 'Sales';
        referenceId = result.invoiceNumber || result.id;
        title = `Invoice ${referenceId} ${operation}d`;
        iconType = 'file-text';
        iconColor = operation === 'create' ? '#22C55E' : '#3B82F6';
        deepLink = `/sales/invoices/${result.id}`;
        break;

      case 'Customer':
        module = 'Customers';
        referenceId = result.name || result.id;
        title = `Customer ${referenceId} ${operation}d`;
        iconType = 'users';
        iconColor = '#8B5CF6'; // purple
        deepLink = `/customers/${result.id}`;
        break;

      case 'Supplier':
        module = 'Purchases';
        referenceId = result.name || result.id;
        title = `Supplier ${referenceId} ${operation}d`;
        iconType = 'truck';
        iconColor = '#F59E0B'; // amber
        break;

      case 'Product':
      case 'Inventory':
        module = 'Inventory';
        referenceId = result.name || result.sku || result.id;
        title = `Product ${referenceId} ${operation}d`;
        iconType = 'package';
        iconColor = '#06B6D4'; // cyan
        break;

      case 'Batch':
        module = 'Production';
        referenceId = result.batchNumber || result.id;
        title = `Batch ${referenceId} ${operation}d`;
        iconType = 'layers';
        iconColor = '#EC4899'; // pink
        break;

      case 'Payment':
        module = 'Finance';
        referenceId = `₹${result.amount || 0}`;
        title = `Payment of ${referenceId} ${operation === 'create' ? 'received' : operation + 'd'}`;
        iconType = 'dollar-sign';
        iconColor = '#10B981'; // emerald
        priority = 'high';
        break;

      case 'Expense':
        module = 'Finance';
        referenceId = `₹${result.amount || 0}`;
        title = `Expense of ${referenceId} ${operation}d`;
        iconType = 'trending-down';
        iconColor = '#EF4444'; // red
        break;

      case 'PurchaseOrder':
        module = 'Purchases';
        referenceId = result.poNumber || result.id;
        title = `Purchase Order ${referenceId} ${operation}d`;
        iconType = 'file-text';
        iconColor = '#6366F1'; // indigo
        if (result.status === 'APPROVED') {
          title = `Purchase Order ${referenceId} approved`;
          priority = 'high';
        }
        break;
        
      case 'Employee':
        module = 'HR';
        referenceId = result.firstName ? `${result.firstName} ${result.lastName || ''}` : result.id;
        title = `Employee ${referenceId} ${operation}d`;
        iconType = 'user';
        iconColor = '#64748B'; // slate
        break;
        
      case 'Attendance':
        module = 'HR';
        title = `Attendance marked for Employee ${result.employeeId}`;
        iconType = 'clock';
        iconColor = '#3B82F6';
        break;
    }

    // Fire and forget, don't await so we don't block the main thread query!
    // Using a separate un-extended prisma client or the raw client would be safer to prevent recursion,
    // but ActivityLog is not in our loggedModels so it shouldn't recurse.
    prisma.activityLog.create({
      data: {
        module,
        action,
        title,
        description: null,
        referenceId: String(referenceId).substring(0, 50),
        iconType,
        iconColor,
        priority,
        deepLink,
      }
    }).catch((err: any) => {
      console.error('Failed to write activity log asynchronously:', err);
    });

  } catch (err) {
    console.error('Error generating activity log context:', err);
  }
}
