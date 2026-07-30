'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  LogOut,
  Moon,
  Sun,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, hasPermission, ROLE_LABELS } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { useTheme } from 'next-themes';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.permission || !user) return true;
    return hasPermission(user.role, item.permission);
  });

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Auto expand submenu if current route belongs to it
  useEffect(() => {
    filteredNavItems.forEach((item) => {
      if (item.children && isActive(item.href)) {
        setOpenSubmenu((prev) => (prev === null ? item.title : prev));
      }
    });
  }, [pathname]);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu((prev) => (prev === title ? null : title));
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-950',
        collapsed ? 'w-[72px]' : 'w-[280px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Flame className="h-5 w-5" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold text-gray-900 dark:text-white"
            >
              Khalid ERP
            </motion.span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openSubmenu === item.title || (active && openSubmenu === null);

            return (
              <li key={item.href}>
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (hasChildren) {
                        toggleSubmenu(item.title);
                      }
                    }}
                    className={cn(
                      'group flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                      active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-200'
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 shrink-0',
                        active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.title}</span>
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSubmenu(item.title);
                            }}
                            className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
                          >
                            <ChevronDown
                              className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                            />
                          </button>
                        )}
                      </>
                    )}
                  </Link>
                </div>

                {/* Submenu */}
                <AnimatePresence>
                  {hasChildren && isOpen && !collapsed && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-6 mt-1 space-y-1 border-l-2 border-blue-100 pl-3 dark:border-blue-900/40 overflow-hidden"
                    >
                      {item.children!.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                'block rounded-lg px-3 py-2 text-xs transition-all font-semibold',
                                childActive
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-sm'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white'
                              )}
                            >
                              {child.title}
                            </Link>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900 font-semibold"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User info */}
        {user && !collapsed && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{ROLE_LABELS[user.role] || user.role}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
