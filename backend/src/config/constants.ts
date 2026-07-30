// ============================================
// Application Constants
// ============================================

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  PRODUCTION_MANAGER: 'PRODUCTION_MANAGER',
  SALES_EXECUTIVE: 'SALES_EXECUTIVE',
  WAREHOUSE: 'WAREHOUSE',
  ACCOUNTANT: 'ACCOUNTANT',
  EMPLOYEE: 'EMPLOYEE',
} as const;

// Role hierarchy — higher index = more permissions
export const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 1000,
  ADMIN: 100,
  PRODUCTION_MANAGER: 80,
  ACCOUNTANT: 70,
  SALES_EXECUTIVE: 60,
  WAREHOUSE: 50,
  EMPLOYEE: 10,
};

// Module-level permissions per role
export const PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // Full access
  ADMIN: ['*'], // Full operational access
  PRODUCTION_MANAGER: [
    'dashboard:read',
    'production:*',
    'batch:*',
    'inventory:read',
    'inventory:update',
    'raw_materials:*',
    'employees:read',
    'reports:production',
    'reports:batch',
    'reports:inventory',
  ],
  SALES_EXECUTIVE: [
    'dashboard:read',
    'customers:*',
    'sales:*',
    'invoices:*',
    'payments:*',
    'products:read',
    'batch:read',
    'inventory:read',
    'reports:sales',
    'reports:customer',
  ],
  WAREHOUSE: [
    'dashboard:read',
    'inventory:*',
    'raw_materials:*',
    'stock_movements:*',
    'products:read',
    'batch:read',
    'purchase:read',
    'reports:inventory',
  ],
  ACCOUNTANT: [
    'dashboard:read',
    'sales:read',
    'invoices:*',
    'payments:*',
    'expenses:*',
    'customers:read',
    'reports:*',
    'purchase:*',
    'settings:gst',
    'settings:financial_year',
  ],
  EMPLOYEE: [
    'dashboard:read',
    'production:read',
    'production:create',
    'attendance:read',
  ],
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// GST Rates used in India
export const GST_RATES = [0, 5, 12, 18, 28];

// Currency
export const CURRENCY = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN',
};

// Expense Categories (seeded)
export const EXPENSE_CATEGORIES = [
  { name: 'Travel', icon: 'plane', color: '#3B82F6' },
  { name: 'Fuel', icon: 'fuel', color: '#F59E0B' },
  { name: 'Salary', icon: 'banknote', color: '#10B981' },
  { name: 'Advertising', icon: 'megaphone', color: '#8B5CF6' },
  { name: 'Electricity', icon: 'zap', color: '#EF4444' },
  { name: 'Gas', icon: 'flame', color: '#F97316' },
  { name: 'Office', icon: 'building', color: '#6366F1' },
  { name: 'Raw Materials', icon: 'package', color: '#14B8A6' },
  { name: 'Miscellaneous', icon: 'more-horizontal', color: '#64748B' },
];
