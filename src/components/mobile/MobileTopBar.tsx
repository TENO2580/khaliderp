'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, ChevronLeft } from 'lucide-react';

export default function MobileTopBar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    const path = pathname.split('/').pop();
    if (!path) return 'Tripidio';
    return path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');
  };

  const isHome = pathname === '/dashboard';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[60px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {!isHome && (
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        )}
        <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {getPageTitle()}
        </h1>
      </div>
      
      <div className="flex items-center gap-1">
        <button 
          onClick={onSearchOpen}
          className="p-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
        >
          <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <button 
          onClick={() => router.push('/dashboard/notifications')}
          className="p-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800 transition-colors relative"
        >
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
        </button>
      </div>
    </div>
  );
}
