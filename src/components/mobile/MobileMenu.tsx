'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronDown, LogOut, Sun, Moon } from 'lucide-react';
import { NAV_ITEMS, hasPermission } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function MobileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.permission || !user) return true;
    return hasPermission(user.role, item.permission);
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleExpand = (title: string) => {
    setExpandedItem((prev) => (prev === title ? null : title));
  };

  return (
    <div className="flex h-full flex-col pb-24">
      <div className="px-4 py-6 bg-white dark:bg-gray-900 shadow-sm mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Menu</h1>
        {user && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Signed in as {user.name} ({user.role})
          </p>
        )}
      </div>

      <div className="px-4 space-y-6 flex-1 overflow-y-auto">
        {/* Accordion Navigation matching Desktop Sidebar */}
        <div className="space-y-3">
          {filteredNavItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItem === item.title;
            const isTopLevelActive = isExpanded; 

            return (
              <div key={item.title} className="flex flex-col">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.title)}
                    className={cn(
                      'flex items-center justify-between w-full p-4 rounded-2xl transition-all font-semibold',
                      isTopLevelActive
                        ? 'bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]'
                        : 'bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-200 border border-gray-100 dark:border-gray-800'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-6 h-6", isTopLevelActive ? "text-white" : "text-blue-600 dark:text-blue-400")} />
                      <span className="text-base">{item.title}</span>
                    </div>
                    <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", isExpanded && "rotate-180")} />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 w-full p-4 rounded-2xl bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-200 border border-gray-100 dark:border-gray-800 font-semibold active:scale-[0.98] transition-transform"
                  >
                    <item.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <span className="text-base">{item.title}</span>
                  </Link>
                )}

                {/* Submenu */}
                <AnimatePresence>
                  {hasChildren && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-1 px-4 py-2 ml-4 mt-2 border-l-2 border-blue-100 dark:border-blue-900/40">
                        {item.children!.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block rounded-xl px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 active:bg-blue-50 dark:active:bg-blue-900/20 active:text-blue-600 dark:active:text-blue-400 transition-colors"
                          >
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* List Navigation for Settings & Logout */}
        <div className="mt-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between p-4 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
