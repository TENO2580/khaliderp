'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  LogOut,
  Sun,
  Flame,
  X,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS, hasPermission, ROLE_LABELS } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { useTheme } from 'next-themes';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(() => {
    const activeItem = NAV_ITEMS.find(
      (item) => item.children && (pathname === item.href || pathname.startsWith(item.href + '/'))
    );
    return activeItem ? activeItem.title : null;
  });

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.permission || !user) return true;
    return hasPermission(user.role, item.permission);
  });

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Auto expand submenu when route changes
  useEffect(() => {
    const activeItem = filteredNavItems.find((item) => item.children && isActive(item.href));
    if (activeItem) {
      setOpenSubmenu(activeItem.title);
    }
  }, [pathname]);

  const toggleSubmenu = (title: string) => {
    setOpenSubmenu((prev) => (prev === title ? null : title));
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}
      
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex flex-col h-screen border-r border-white/60 bg-white/70 backdrop-blur-3xl transition-all duration-300 dark:border-white/[0.05] dark:bg-[#12121a]/60 dark:backdrop-blur-3xl',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[280px]',
          mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full lg:translate-x-0'
        )}
      >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/40 px-4 dark:border-white/[0.05]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img
            src="/tripidio-logo.png"
            alt="Tripidio ERP"
            className="h-9 w-auto rounded-lg object-contain bg-black p-1"
          />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold tracking-wide text-gray-900 dark:text-white"
            >
              Tripidio <span className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400 ml-1">ERP</span>
            </motion.span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="hidden lg:block rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
        <button
          onClick={onMobileClose}
          className="lg:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openSubmenu === item.title;

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
                        ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500/30'
                        : 'text-gray-600 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
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
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 dark:shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                                  : 'text-gray-500 hover:bg-black/5 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
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
      <div className="border-t border-white/40 p-3 dark:border-white/[0.05]">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-600 hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/5 font-semibold"
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
    </>
  );
}
