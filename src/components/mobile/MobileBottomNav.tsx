'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Users, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sales', href: '/dashboard/sales', icon: ShoppingCart },
    { name: 'Customers', href: '/dashboard/customers', icon: Users },
    { name: 'Menu', href: '/dashboard/menu', icon: Menu }, // Or open a drawer
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[72px] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pb-safe">
      <div className="flex h-full items-center justify-around px-2 pb-2 pt-1">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard' 
            ? pathname === '/dashboard' 
            : pathname.startsWith(item.href);

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 rounded-xl transition-colors active:bg-gray-100 dark:active:bg-gray-800",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-blue-100 dark:fill-blue-900/30")} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
