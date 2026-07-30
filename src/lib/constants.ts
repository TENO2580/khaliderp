import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Factory,
  Package,
  Layers,
  Receipt,
  UserCog,
  BarChart3,
  Settings,
  Bell,
  Truck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  badge?: string;
  children?: { title: string; href: string }[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:read',
  },
  {
    title: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
    permission: 'customers:read',
  },
  {
    title: 'Sales',
    href: '/dashboard/sales',
    icon: ShoppingCart,
    permission: 'sales:read',
    children: [
      { title: 'Orders', href: '/dashboard/sales' },
      { title: 'Invoices', href: '/dashboard/sales/invoices' },
      { title: 'Payments', href: '/dashboard/sales/payments' },
    ],
  },
  {
    title: 'Production',
    href: '/dashboard/production',
    icon: Factory,
    permission: 'production:read',
  },
  {
    title: 'Inventory',
    href: '/dashboard/inventory',
    icon: Package,
    permission: 'inventory:read',
    children: [
      { title: 'Finished Goods', href: '/dashboard/inventory' },
      { title: 'Raw Materials', href: '/dashboard/inventory/raw-materials' },
      { title: 'Stock Movements', href: '/dashboard/inventory/movements' },
    ],
  },
  {
    title: 'Batches',
    href: '/dashboard/batches',
    icon: Layers,
    permission: 'batch:read',
  },
  {
    title: 'Purchase',
    href: '/dashboard/purchase',
    icon: Truck,
    permission: 'purchase:read',
  },
  {
    title: 'Expenses',
    href: '/dashboard/expenses',
    icon: Receipt,
    permission: 'expenses:read',
  },
  {
    title: 'Employees',
    href: '/dashboard/employees',
    icon: UserCog,
    permission: 'employees:read',
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    permission: 'reports:read',
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
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
  const perms = PERMISSIONS[role] || [];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;

  const [module] = permission.split(':');
  return perms.includes(`${module}:*`);
}
