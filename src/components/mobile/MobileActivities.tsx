'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import {
  History,
  Search,
  Filter,
  Download,
  RefreshCw,
  LogIn,
  PlusCircle,
  Trash2,
  Edit,
  Layers,
  ShoppingCart,
  Users,
  Factory,
  Receipt,
  Shield,
  Clock,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const fetcher = (url: string) => api.get(url).then((res) => res.data.data);

export default function MobileActivities() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 20;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Derive module or action from activeTab
  let moduleParam = '';
  let actionParam = '';
  if (activeTab === 'LOGIN') {
    actionParam = 'LOGIN';
  } else if (activeTab === 'DELETED') {
    actionParam = 'DELETED';
  } else if (activeTab !== 'ALL') {
    moduleParam = activeTab;
  }

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
    ...(moduleParam ? { module: moduleParam } : {}),
    ...(actionParam ? { action: actionParam } : {}),
  }).toString();

  const { data: resData, isLoading, mutate } = useSWR(`/activities?${queryParams}`, fetcher);

  const activities = resData?.data || [];
  const pagination = resData?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };
  const stats = resData?.stats || { totalActivities: 0, logins: 0, created: 0, deleted: 0 };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Activities updated');
  };

  const handleExportCSV = () => {
    if (!activities.length) {
      toast.error('No activities to export');
      return;
    }

    const headers = ['Date', 'Time', 'User', 'Action', 'Module', 'Title', 'Description', 'Reference'];
    const rows = activities.map((item: any) => {
      const d = new Date(item.createdAt);
      const dateStr = d.toLocaleDateString('en-GB');
      const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const user = item.user?.name || 'System';
      const action = item.action || '';
      const mod = item.module || '';
      const title = (item.title || '').replace(/"/g, '""');
      const desc = (item.description || '').replace(/"/g, '""');
      const ref = (item.referenceId || '').replace(/"/g, '""');
      return `"${dateStr}","${timeStr}","${user}","${action}","${mod}","${title}","${desc}","${ref}"`;
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khaliderp_activities_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV downloaded');
  };

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <LogIn className="w-3 h-3" /> Login
          </span>
        );
      case 'CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <PlusCircle className="w-3 h-3" /> Added
          </span>
        );
      case 'DELETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Trash2 className="w-3 h-3" /> Deleted
          </span>
        );
      case 'UPDATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Edit className="w-3 h-3" /> Updated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-500/10 text-gray-600 dark:text-gray-400">
            {action}
          </span>
        );
    }
  };

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'Batches':
        return <Layers className="w-3.5 h-3.5 text-pink-500" />;
      case 'Sales':
        return <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />;
      case 'Customers':
        return <Users className="w-3.5 h-3.5 text-purple-500" />;
      case 'Production':
        return <Factory className="w-3.5 h-3.5 text-cyan-500" />;
      case 'Expenses':
      case 'Finance':
        return <Receipt className="w-3.5 h-3.5 text-amber-500" />;
      case 'Auth':
        return <Shield className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <History className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateFormatted} • ${timeFormatted}`;
  };

  const getRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Mobile Top Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Activity History</h1>
              <p className="text-[11px] text-gray-500">{pagination.total} actions recorded</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-blue-600')} />
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-xl bg-blue-600 text-white shadow-sm"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mt-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activities, users, orders..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800/80 border-none text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 mt-1">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'LOGIN', label: 'Logins' },
            { id: 'Batches', label: 'Batches' },
            { id: 'Sales', label: 'Orders' },
            { id: 'Customers', label: 'Customers' },
            { id: 'Production', label: 'Production' },
            { id: 'Expenses', label: 'Expenses' },
            { id: 'DELETED', label: 'Deleted' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={cn(
                'whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Feed List */}
      <div className="p-4 space-y-3 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading activity history...</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 gap-2">
            <History className="w-10 h-10 stroke-[1.5]" />
            <span className="font-semibold text-sm text-gray-600 dark:text-gray-300">No activities found</span>
            <span className="text-xs max-w-xs">Try selecting a different filter or clearing search.</span>
          </div>
        ) : (
          activities.map((item: any) => {
            const timeStr = formatTimestamp(item.createdAt);
            const relTime = getRelativeTime(item.createdAt);
            const userName = item.user?.name || (item.user?.email ? item.user.email.split('@')[0] : 'System');
            const userRole = item.user?.role;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-2.5 active:scale-[0.99] transition-transform"
              >
                {/* Header: Module + Action + Time */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {getModuleIcon(item.module)}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{item.module}</span>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    {getActionBadge(item.action)}
                  </div>
                  <span className="text-[11px] font-medium text-gray-400">{relTime}</span>
                </div>

                {/* Title and Description */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Footer: User Attribution + Reference ID */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800/60 text-xs">
                  <div className="flex items-center gap-2">
                    {item.user?.avatar ? (
                      <img
                        src={item.user.avatar}
                        alt={userName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-gray-700 dark:text-gray-300">{userName}</span>
                    {userRole && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 font-semibold">
                        {userRole.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>{timeStr}</span>
                  </div>
                </div>

                {/* Deep Link if present */}
                {item.deepLink && item.referenceId && (
                  <div className="pt-1">
                    <Link
                      href={item.deepLink}
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>View record: {item.referenceId}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Mobile Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 pb-6 text-xs text-gray-500">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
