'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { NotificationCard, Notification } from '@/components/shared/NotificationCard';
import { Bell, CheckCircle2, Filter, Search } from 'lucide-react';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function NotificationsPage() {
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD
  const [moduleFilter, setModuleFilter] = useState('ALL');
  
  const endpoint = `/api/notifications?limit=50${filter === 'UNREAD' ? '&unread=true' : ''}${moduleFilter !== 'ALL' ? `&module=${moduleFilter}` : ''}`;
  
  const { data: notifRes, mutate } = useSWR(endpoint, fetcher, { 
    refreshInterval: 15000 
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
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-gray-50/50 p-4 lg:p-8 dark:bg-[#12121a]">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">You have {unreadCount} unread messages</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark all as read
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 p-6 dark:border-gray-800 hidden md:block">
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</h3>
                <div className="space-y-1">
                  {['ALL', 'UNREAD'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                        filter === f 
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {f === 'ALL' ? 'All Notifications' : 'Unread'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Modules</h3>
                <div className="space-y-1">
                  {['ALL', 'SALES', 'PRODUCTION', 'INVENTORY'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setModuleFilter(m)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                        moduleFilter === m 
                          ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white' 
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      {m === 'ALL' ? 'All Modules' : m.charAt(0) + m.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
      </div>
    </div>
  );
}
