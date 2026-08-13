'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { NotificationCard, Notification } from '@/components/shared/NotificationCard';
import { Bell, CheckCircle2, Filter, Search } from 'lucide-react';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function MobileNotifications() {
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD
  const [moduleFilter, setModuleFilter] = useState('ALL');
  
  const endpoint = `/api/notifications?limit=50${filter === 'UNREAD' ? '&unread=true' : ''}${moduleFilter !== 'ALL' ? `&module=${moduleFilter}` : ''}`;
  
  const { data: notifRes, mutate } = useSWR(endpoint, fetcher, { 
    refreshInterval: 300000,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  
  const notifications: Notification[] = notifRes?.data || [];
  const unreadCount = notifRes?.pagination?.unreadCount || 0;

  const handleMarkAsRead = async (id: string) => {
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
    <div className="space-y-6 pb-20">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {['ALL', 'UNREAD'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              filter === f 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400'
            }`}
          >
            {f === 'ALL' ? 'All' : 'Unread'}
          </button>
        ))}
        {['SYSTEM', 'SALES', 'INVENTORY'].map((m) => (
          <button
            key={m}
            onClick={() => setModuleFilter(m)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              moduleFilter === m 
                ? 'bg-gray-900 text-white shadow-md dark:bg-white dark:text-gray-900' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{unreadCount} unread messages</p>
        <button 
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <CheckCircle2 className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      <div className="space-y-4">
        {!notifRes ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All caught up!</h3>
            <p className="text-gray-500 dark:text-gray-400">There are no notifications matching your filters.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {notifications.map(notif => (
              <NotificationCard 
                key={notif.id}
                notification={notif}
                onRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
