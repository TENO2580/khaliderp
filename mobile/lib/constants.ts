export interface NavItem {
  title: string;
  href: string;
  icon: keyof typeof import('@expo/vector-icons/Ionicons').default.glyphMap;
  permission?: string;
  badge?: string;
  children?: { title: string; href: string }[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/(erp)',
    icon: 'grid-outline',
    permission: 'dashboard:read',
  },
  {
    title: 'Customers',
    href: '/(erp)/customers',
    icon: 'people-outline',
    permission: 'customers:read',
    children: [
      { title: 'Customer List', href: '/(erp)/customers' },
      { title: 'Field Routes', href: '/(erp)/routes' },
      { title: 'Stock Alerts', href: '/(erp)/customers/followups' },
    ]
  },
  {
    title: 'Sales',
    href: '/(erp)/sales',
    icon: 'cart-outline',
    permission: 'sales:read',
    children: [
      { title: 'Orders', href: '/(erp)/sales' },
      { title: 'Batches', href: '/(erp)/batches' },
      { title: 'Invoices', href: '/(erp)/sales/invoices' },
      { title: 'Payments', href: '/(erp)/sales/payments' },
    ],
  },
  {
    title: 'Production',
    href: '/(erp)/production',
    icon: 'construct-outline',
    permission: 'production:read',
  },
  {
    title: 'Purchase',
    href: '/(erp)/purchase',
    icon: 'bus-outline', // truck equivalent
    permission: 'purchase:read',
  },
  {
    title: 'Expenses',
    href: '/(erp)/expenses',
    icon: 'receipt-outline',
    permission: 'expenses:read',
  },
  {
    title: 'Pricing Engine',
    href: '/(erp)/pricing',
    icon: 'bar-chart-outline',
    permission: 'settings:read',
  },
  {
    title: 'Employees',
    href: '/(erp)/employees',
    icon: 'person-outline',
    permission: 'employees:read',
  },
  {
    title: 'Reports',
    href: '/(erp)/reports',
    icon: 'stats-chart-outline',
    permission: 'reports:read',
  },
  {
    title: 'Intelligence',
    href: '/(erp)/intelligence',
    icon: 'bulb-outline',
    permission: 'dashboard:read',
  },
  {
    title: 'Settings',
    href: '/(erp)/settings',
    icon: 'settings-outline',
    permission: 'settings:read',
  },
];

// Role display names
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  PRODUCTION_MANAGER: 'Production Manager',
  SALES_EXECUTIVE: 'Sales Executive',
  WAREHOUSE: 'Warehouse',
  ACCOUNTANT: 'Accountant',
  EMPLOYEE: 'Employee',
};

// Permissions map (same as backend)
export const PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: ['*'],
  PRODUCTION_MANAGER: ['dashboard:read', 'production:*', 'batch:*', 'inventory:read', 'inventory:update', 'raw_materials:*', 'employees:read', 'reports:production', 'reports:batch', 'reports:inventory'],
  SALES_EXECUTIVE: ['dashboard:read', 'customers:*', 'sales:*', 'invoices:*', 'payments:*', 'products:read', 'batch:read', 'inventory:read', 'reports:sales', 'reports:customer'],
  WAREHOUSE: ['dashboard:read', 'inventory:*', 'raw_materials:*', 'stock_movements:*', 'products:read', 'batch:read', 'purchase:read', 'reports:inventory'],
  ACCOUNTANT: ['dashboard:read', 'sales:read', 'invoices:*', 'payments:*', 'expenses:*', 'customers:read', 'reports:*', 'purchase:*', 'settings:gst', 'settings:financial_year'],
  EMPLOYEE: ['dashboard:read', 'production:read', 'production:create', 'attendance:read'],
};

/**
 * Check if user role has a specific permission
 */
export function hasPermission(role: string, permission: string): boolean {
  if (!role) return false;
  const perms = PERMISSIONS[role] || [];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;

  const [module] = permission.split(':');
  return perms.includes(`${module}:*`);
}
