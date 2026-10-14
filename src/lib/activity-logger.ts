import { getCurrentUser, CurrentUserContext } from './user-context';

/**
 * Intercepts Prisma operations and logs them to the ActivityLog table.
 */
export async function logActivity(
  prisma: any,
  model: string,
  operation: string,
  args: any,
  result: any,
  explicitUser?: CurrentUserContext
) {
  // Only log create, update, delete operations
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
    const user = explicitUser || getCurrentUser();
    const actorName = user?.name || (user?.email ? user.email.split('@')[0] : 'System');
    const actorRole = user?.role ? ` (${user.role.replace('_', ' ')})` : '';
    const userId = user?.id || result?.userId || result?.createdById || result?.createdBy || (model === 'User' ? result?.id : null);

    let module = model;
    let title = `${model} ${operation}d`;
    let description: string | null = null;
    let iconType = 'info';
    let iconColor = '#9CA3AF'; // default gray
    let priority = 'normal';
    let referenceId = result?.id || '';
    let deepLink = '';

    // Map operation to generic action
    const actionMap: Record<string, string> = {
      create: 'CREATED',
      update: 'UPDATED',
      delete: 'DELETED',
    };
    const action = actionMap[operation] || operation.toUpperCase();

    // Custom formatting based on model
    switch (model) {
      case 'Batch':
        module = 'Batches';
        referenceId = result?.batchNumber || args?.where?.batchNumber || result?.id || 'Batch';
        iconType = 'layers';
        if (operation === 'create') {
          title = `Batch ${referenceId} added`;
          description = `Batch ${referenceId} added by ${actorName}${actorRole} with ${Number(result?.waxInitialQty || 0).toLocaleString()} KG wax`;
          iconColor = '#EC4899'; // pink
        } else if (operation === 'delete') {
          title = `Batch ${referenceId} deleted`;
          description = `Batch ${referenceId} deleted by ${actorName}${actorRole}`;
          iconColor = '#EF4444'; // red
          priority = 'high';
        } else {
          title = `Batch ${referenceId} updated`;
          description = `Batch ${referenceId} updated by ${actorName}${actorRole}`;
          iconColor = '#3B82F6'; // blue
        }
        deepLink = `/dashboard/batches?search=${encodeURIComponent(referenceId)}`;
        break;

      case 'SalesOrder':
        module = 'Sales';
        referenceId = result?.orderNumber || args?.where?.orderNumber || result?.id || 'Order';
        iconType = 'shopping-cart';
        if (operation === 'create') {
          title = `Order ${referenceId} created`;
          const amt = Number(result?.totalAmount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
          description = `Sales Order ${referenceId} added by ${actorName}${actorRole} for ${amt}`;
          iconColor = '#22C55E'; // green
        } else if (operation === 'delete') {
          title = `Order ${referenceId} deleted`;
          description = `Sales Order ${referenceId} deleted by ${actorName}${actorRole}`;
          iconColor = '#EF4444'; // red
          priority = 'high';
        } else {
          title = `Order ${referenceId} updated`;
          description = `Sales Order ${referenceId} status/details updated by ${actorName}${actorRole}`;
          iconColor = '#3B82F6'; // blue
        }
        deepLink = `/dashboard/sales?search=${encodeURIComponent(referenceId)}`;
        break;

      case 'Customer':
        module = 'Customers';
        referenceId = result?.name || args?.where?.name || result?.customerId || result?.id || 'Customer';
        iconType = 'users';
        if (operation === 'create') {
          title = `Customer "${referenceId}" added`;
          description = `Customer "${referenceId}" created by ${actorName}${actorRole}${result?.route ? ` (Route: ${result.route})` : ''}`;
          iconColor = '#8B5CF6'; // purple
        } else if (operation === 'delete') {
          title = `Customer "${referenceId}" deleted`;
          description = `Customer "${referenceId}" deleted by ${actorName}${actorRole}`;
          iconColor = '#EF4444'; // red
          priority = 'high';
        } else {
          title = `Customer "${referenceId}" updated`;
          description = `Customer profile "${referenceId}" updated by ${actorName}${actorRole}`;
          iconColor = '#3B82F6';
        }
        deepLink = `/dashboard/customers?search=${encodeURIComponent(referenceId)}`;
        break;

      case 'Production':
        module = 'Production';
        referenceId = result?.productionNumber || args?.where?.productionNumber || result?.id || 'Production';
        iconType = 'factory';
        if (operation === 'create') {
          title = `Production ${referenceId} recorded`;
          description = `Production entry ${referenceId} added by ${actorName}${actorRole} (${result?.waxUsed || 0} KG wax consumed)`;
          iconColor = '#06B6D4'; // cyan
        } else if (operation === 'delete') {
          title = `Production ${referenceId} deleted`;
          description = `Production entry ${referenceId} deleted by ${actorName}${actorRole}`;
          iconColor = '#EF4444'; // red
          priority = 'high';
        } else {
          title = `Production ${referenceId} updated`;
          description = `Production entry ${referenceId} updated by ${actorName}${actorRole}`;
          iconColor = '#3B82F6';
        }
        deepLink = `/dashboard/production`;
        break;

      case 'Expense':
        module = 'Expenses';
        const formattedAmt = Number(result?.amount || args?.data?.amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
        referenceId = formattedAmt;
        iconType = 'receipt';
        if (operation === 'create') {
          title = `Expense of ${formattedAmt} added`;
          description = `Expense of ${formattedAmt} recorded by ${actorName}${actorRole}${result?.description ? ` (${result.description})` : ''}`;
          iconColor = '#F59E0B'; // amber
        } else if (operation === 'delete') {
          title = `Expense of ${formattedAmt} deleted`;
          description = `Expense entry of ${formattedAmt} deleted by ${actorName}${actorRole}`;
          iconColor = '#EF4444'; // red
          priority = 'high';
        } else {
          title = `Expense of ${formattedAmt} updated`;
          description = `Expense entry of ${formattedAmt} updated by ${actorName}${actorRole}`;
          iconColor = '#3B82F6';
        }
        deepLink = `/dashboard/accounts/expenses`;
        break;

      case 'Invoice':
        module = 'Sales';
        referenceId = result?.invoiceNumber || result?.id || 'Invoice';
        title = `Invoice ${referenceId} ${operation === 'create' ? 'generated' : operation + 'd'}`;
        description = `Invoice ${referenceId} ${operation}d by ${actorName}${actorRole}`;
        iconType = 'file-text';
        iconColor = operation === 'create' ? '#22C55E' : '#3B82F6';
        deepLink = `/dashboard/sales/invoices`;
        break;

      case 'Payment':
        module = 'Finance';
        const pAmt = Number(result?.amount || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
        referenceId = pAmt;
        title = `Payment of ${pAmt} recorded`;
        description = `Payment of ${pAmt} received/recorded by ${actorName}${actorRole}`;
        iconType = 'dollar-sign';
        iconColor = '#10B981';
        priority = 'high';
        break;

      case 'PurchaseOrder':
        module = 'Purchase';
        referenceId = result?.poNumber || result?.id || 'PO';
        title = `Purchase Order ${referenceId} ${operation}d`;
        description = `Purchase Order ${referenceId} ${operation}d by ${actorName}${actorRole}`;
        iconType = 'truck';
        iconColor = '#6366F1';
        deepLink = `/dashboard/purchase`;
        break;

      case 'Product':
      case 'Inventory':
        module = 'Inventory';
        referenceId = result?.name || result?.sku || result?.id || 'Product';
        title = `Product ${referenceId} ${operation}d`;
        description = `Product ${referenceId} ${operation}d by ${actorName}${actorRole}`;
        iconType = 'package';
        iconColor = '#06B6D4';
        break;

      case 'Employee':
        module = 'Employees';
        referenceId = result?.firstName ? `${result.firstName} ${result.lastName || ''}`.trim() : (result?.name || result?.id);
        title = `Employee ${referenceId} ${operation}d`;
        description = `Employee ${referenceId} ${operation}d by ${actorName}${actorRole}`;
        iconType = 'user';
        iconColor = '#64748B';
        deepLink = `/dashboard/employees`;
        break;

      case 'Attendance':
        module = 'Employees';
        referenceId = `Employee #${result?.employeeId || ''}`;
        title = `Attendance marked for ${referenceId}`;
        description = `Attendance marked by ${actorName}${actorRole}`;
        iconType = 'clock';
        iconColor = '#3B82F6';
        break;

      case 'User':
        module = 'Users';
        referenceId = result?.name || result?.email || result?.id || 'User';
        title = `User account ${referenceId} ${operation}d`;
        description = `User account ${referenceId} ${operation}d by ${actorName}${actorRole}`;
        iconType = 'shield';
        iconColor = '#8B5CF6';
        break;

      default:
        description = `${model} ${operation}d by ${actorName}${actorRole}`;
        break;
    }

    // Fire and forget asynchronously
    prisma.activityLog.create({
      data: {
        module,
        action,
        title,
        description,
        referenceId: String(referenceId).substring(0, 50),
        userId: userId || null,
        iconType,
        iconColor,
        priority,
        deepLink,
      },
    }).catch((err: any) => {
      console.error('Failed to write activity log asynchronously:', err);
    });
  } catch (err) {
    console.error('Error generating activity log context:', err);
  }
}

/**
 * Explicit helper to log authentication events (Login, Logout, etc.)
 */
export async function logAuthActivity(
  prisma: any,
  user: { id: string; name?: string | null; email: string; role?: string },
  action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE',
  details?: string
) {
  try {
    const actorName = user.name || user.email.split('@')[0];
    const roleFormatted = user.role ? ` (${user.role.replace('_', ' ')})` : '';

    await prisma.activityLog.create({
      data: {
        module: 'Auth',
        action,
        title: `${actorName} logged in`,
        description: details || `${actorName}${roleFormatted} signed into account (${user.email})`,
        referenceId: user.email,
        userId: user.id,
        iconType: 'log-in',
        iconColor: '#10B981', // emerald
        priority: 'normal',
      },
    });
  } catch (err) {
    console.error('Failed to log auth activity:', err);
  }
}
