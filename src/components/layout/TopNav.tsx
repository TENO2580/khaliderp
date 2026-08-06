'use client';

import React, { useState } from 'react';
import { Search, Bell, Command, Menu, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { getInitials } from '@/lib/utils';
import useSWR from 'swr';
import axios from 'axios';
import { NotificationCard, Notification } from '@/components/shared/NotificationCard';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

interface TopNavProps {
  sidebarCollapsed: boolean;
  onSearchOpen: () => void;
  onMobileMenuClick?: () => void;
}

export default function TopNav({ sidebarCollapsed, onSearchOpen, onMobileMenuClick }: TopNavProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notifRes, mutate } = useSWR(user ? '/api/notifications?limit=10' : null, fetcher, { 
    refreshInterval: 300000, // 5 minutes
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  
  const notifications: Notification[] = notifRes?.data || [];
  const unreadCount = notifRes?.pagination?.unreadCount || 0;

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    mutate({
      ...notifRes,
      data: notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
      pagination: { ...notifRes?.pagination, unreadCount: Math.max(0, unreadCount - 1) }
    }, false);
    
    try {
      await axios.patch(`/api/notifications/${id}`, { action: 'read' });
    } catch (e) {
      mutate();
    }
  };

  const handleMarkAllRead = async () => {
    mutate({
      ...notifRes,
      data: notifications.map(n => ({ ...n, isRead: true })),
      pagination: { ...notifRes?.pagination, unreadCount: 0 }
    }, false);
    
    try {
      await axios.patch('/api/notifications', { action: 'markAllRead' });
    } catch (e) {
      mutate();
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-50 flex h-16 items-center justify-between border-b border-white bg-white/60 px-4 md:px-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl transition-all duration-300 dark:border-white/[0.05] dark:bg-[#12121a]/60',
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
        className="flex items-center gap-3 rounded-xl border border-white bg-white/60 px-4 py-2 text-sm text-gray-500 transition-colors hover:bg-white/90 shadow-[0_4px_15px_rgb(0,0,0,0.02)] backdrop-blur-md dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
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
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-96 rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-[#12121a]">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[28rem] overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">
                    <Bell className="mx-auto mb-2 h-8 w-8 opacity-20" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {notifications.map((notif) => (
                      <NotificationCard 
                        key={notif.id} 
                        notification={notif} 
                        onRead={handleMarkAsRead}
                        onClose={() => setShowNotifications(false)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 p-2 dark:border-gray-800">
                <button 
                  onClick={() => {
                    setShowNotifications(false);
                    // router.push('/dashboard/notifications');
                  }}
                  className="w-full rounded-lg py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold text-white overflow-hidden shadow-sm">
              {user.avatar ? (
                <img loading="lazy" src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                getInitials(user.name)
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
