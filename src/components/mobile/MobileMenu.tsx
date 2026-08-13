'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, LogOut, Sun, Moon } from 'lucide-react';
import { NAV_ITEMS, hasPermission } from '@/lib/constants';
import { useAuth } from '@/lib/auth';
import { useTheme } from 'next-themes';

export default function MobileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.permission || !user) return true;
    return hasPermission(user.role, item.permission);
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
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
        {/* Main Grid Navigation */}
        <div className="grid grid-cols-4 gap-4">
          {filteredNavItems.map((item) => (
            <Link 
              key={item.title} 
              href={item.href}
              className="flex flex-col items-center justify-center gap-2"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 active:scale-95 transition-transform">
                <item.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                {item.title}
              </span>
            </Link>
          ))}
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
