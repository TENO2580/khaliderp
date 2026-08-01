'use client';

import React, { useState } from 'react';
import { Search, Bell, Command, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { getInitials } from '@/lib/utils';

interface TopNavProps {
  sidebarCollapsed: boolean;
  onSearchOpen: () => void;
  onMobileMenuClick?: () => void;
}

export default function TopNav({ sidebarCollapsed, onSearchOpen, onMobileMenuClick }: TopNavProps) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-white/40 bg-white/70 px-4 md:px-6 backdrop-blur-2xl transition-all duration-300 dark:border-white/[0.05] dark:bg-[#12121a]/60',
        'left-0', // Default mobile
        sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-[280px]' // Desktop
      )}
    >
      {/* Left side: Mobile Menu + Search Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuClick}
          className="lg:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
        onClick={onSearchOpen}
        className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-2 text-sm text-gray-500 transition-colors hover:bg-white/90 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.06] shadow-sm backdrop-blur-md"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search customers, invoices, batches...</span>
        <kbd className="hidden rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 md:inline">
          <Command className="inline h-3 w-3" />K
        </kbd>
      </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl p-2.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {[
                  { title: 'Low Stock Alert', message: 'Paraffin Wax stock is below reorder level', time: '5m ago', type: 'warning' },
                  { title: 'Payment Received', message: '₹25,000 from Aroma House', time: '1h ago', type: 'success' },
                  { title: 'Order Pending', message: 'SO-2026-0042 needs confirmation', time: '2h ago', type: 'info' },
                ].map((notif, i) => (
                  <div key={i} className="rounded-xl px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-800">
                <button className="w-full text-center text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role.replace('_', ' ')}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold text-white">
              {getInitials(user.name)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
