'use client';

import React, { useState, useMemo } from 'react';
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
  Calendar,
  ArrowUpRight,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const fetcher = (url: string) => api.get(url).then((res) => res.data.data);

export default function DesktopActivities() {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute effective date range
  const { queryStartDate, queryEndDate } = useMemo(() => {
    if (dateRange === 'CUSTOM') {
      return { queryStartDate: startDate, queryEndDate: endDate };
    }
    const now = new Date();
    if (dateRange === 'TODAY') {
      const todayStr = now.toISOString().split('T')[0];
      return { queryStartDate: todayStr, queryEndDate: todayStr };
    }
    if (dateRange === 'YESTERDAY') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { queryStartDate: yStr, queryEndDate: yStr };
    }
    if (dateRange === 'LAST_7_DAYS') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      return { queryStartDate: past.toISOString().split('T')[0], queryEndDate: now.toISOString().split('T')[0] };
    }
    if (dateRange === 'LAST_30_DAYS') {
      const past = new Date();
      past.setDate(past.getDate() - 30);
      return { queryStartDate: past.toISOString().split('T')[0], queryEndDate: now.toISOString().split('T')[0] };
    }
    return { queryStartDate: '', queryEndDate: '' };
  }, [dateRange, startDate, endDate]);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
    ...(moduleFilter !== 'ALL' ? { module: moduleFilter } : {}),
    ...(actionFilter !== 'ALL' ? { action: actionFilter } : {}),
    ...(queryStartDate ? { startDate: queryStartDate } : {}),
    ...(queryEndDate ? { endDate: queryEndDate } : {}),
  }).toString();

  const { data: resData, isLoading, mutate } = useSWR(`/activities?${queryParams}`, fetcher, {
    revalidateOnFocus: true,
  });

  const activities = resData?.data || [];
  const pagination = resData?.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 };
  const stats = resData?.stats || { totalActivities: 0, logins: 0, created: 0, deleted: 0, updated: 0 };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success('Activity log refreshed');
  };

  const handleExportCSV = () => {
    if (!activities.length) {
      toast.error('No activities to export');
      return;
    }

    const headers = [
      'Date',
      'Time',
      'User Name',
      'User Email',
      'User Role',
      'Action',
      'Module',
      'Title',
      'Description',
      'Reference ID',
    ];

    const rows = activities.map((item: any) => {
      const d = new Date(item.createdAt);
      const dateStr = d.toLocaleDateString('en-GB');
      const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      const userName = item.user?.name || 'System';
      const userEmail = item.user?.email || 'N/A';
      const userRole = item.user?.role || 'N/A';
      const action = item.action || '';
      const moduleName = item.module || '';
      const title = (item.title || '').replace(/"/g, '""');
      const desc = (item.description || '').replace(/"/g, '""');
      const refId = (item.referenceId || '').replace(/"/g, '""');

      return `"${dateStr}","${timeStr}","${userName}","${userEmail}","${userRole}","${action}","${moduleName}","${title}","${desc}","${refId}"`;
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `khaliderp_activities_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported activities to CSV');
  };

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <LogIn className="w-3.5 h-3.5" /> Login
          </span>
        );
      case 'CREATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <PlusCircle className="w-3.5 h-3.5" /> Added
          </span>
        );
      case 'DELETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Trash2 className="w-3.5 h-3.5" /> Deleted
          </span>
        );
      case 'UPDATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Edit className="w-3.5 h-3.5" /> Updated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
            {action}
          </span>
        );
    }
  };

  const getModuleBadge = (mod: string) => {
    switch (mod) {
      case 'Batches':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
            <Layers className="w-3.5 h-3.5" /> Batches
          </span>
        );
      case 'Sales':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <ShoppingCart className="w-3.5 h-3.5" /> Sales
          </span>
        );
      case 'Customers':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Users className="w-3.5 h-3.5" /> Customers
          </span>
        );
      case 'Production':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Factory className="w-3.5 h-3.5" /> Production
          </span>
        );
      case 'Expenses':
      case 'Finance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Receipt className="w-3.5 h-3.5" /> Expenses
          </span>
        );
      case 'Auth':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Shield className="w-3.5 h-3.5" /> Auth
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            {mod}
          </span>
        );
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return { dateFormatted, timeFormatted };
  };

  const getRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 p-6 rounded-3xl border border-blue-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <History className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Activity Log & Audit Trail</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                Live Audit
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Complete chronological history of user logins, orders, batches, customers, production, and expenses.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition shadow-sm font-medium text-sm"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-blue-600')} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:from-blue-700 hover:to-indigo-700 transition shadow-md shadow-blue-500/25"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Activities */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Activities</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {Number(pagination.total || 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <span>Recorded actions in database</span>
          </div>
        </div>

        {/* User Logins */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">User Logins</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <LogIn className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {Number(stats.logins || 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Account logins & sessions</span>
          </div>
        </div>

        {/* Records Added */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created / Added</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {Number(stats.created || 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
            <span>Batches, orders, customers & expenses</span>
          </div>
        </div>

        {/* Records Deleted */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Deletions</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {Number(stats.deleted || 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Audit tracking for removed items</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
        {/* Module Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'All Modules' },
            { id: 'Auth', label: 'Auth / Logins' },
            { id: 'Batches', label: 'Batches' },
            { id: 'Sales', label: 'Sales & Orders' },
            { id: 'Customers', label: 'Customers' },
            { id: 'Production', label: 'Production' },
            { id: 'Expenses', label: 'Expenses' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setModuleFilter(tab.id);
                setPage(1);
              }}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
                moduleFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, order number, batch code, customer, details..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">Logins</option>
              <option value="CREATED">Added / Created</option>
              <option value="UPDATED">Updated</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7_DAYS">Last 7 Days</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Picker (Conditional) */}
        {dateRange === 'CUSTOM' && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Activity Table */}
      <div className="rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">User / Account</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Event Details</th>
                <th className="py-3.5 px-4">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading activity records...</span>
                    </div>
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                        <History className="w-6 h-6" />
                      </div>
                      <span className="text-base font-semibold text-gray-700 dark:text-gray-300">No activity logs found</span>
                      <p className="text-xs text-gray-400 max-w-sm">
                        Try adjusting your search terms or filters to view historical activities.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                activities.map((item: any) => {
                  const { dateFormatted, timeFormatted } = formatTimestamp(item.createdAt);
                  const relTime = getRelativeTime(item.createdAt);
                  const userName = item.user?.name || (item.user?.email ? item.user.email.split('@')[0] : 'System');
                  const userEmail = item.user?.email;
                  const userRole = item.user?.role;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors group"
                    >
                      {/* Date & Time */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{dateFormatted}</span>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{timeFormatted}</span>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">{relTime}</span>
                          </div>
                        </div>
                      </td>

                      {/* User / Account */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {item.user?.avatar ? (
                            <img
                              src={item.user.avatar}
                              alt={userName}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                              {userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">{userName}</span>
                              {userRole && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                  {userRole.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            {userEmail && <span className="text-xs text-gray-400">{userEmail}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 whitespace-nowrap">{getActionBadge(item.action)}</td>

                      {/* Module */}
                      <td className="py-4 px-4 whitespace-nowrap">{getModuleBadge(item.module)}</td>

                      {/* Event Details */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col max-w-md">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">
                            {item.title}
                          </span>
                          {item.description && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reference */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {item.referenceId ? (
                          item.deepLink ? (
                            <Link
                              href={item.deepLink}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition border border-gray-200/60 dark:border-gray-700"
                            >
                              <span>{item.referenceId}</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/60">
                              {item.referenceId}
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="py-3 px-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span>
              Showing {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activities
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <div className="flex items-center gap-1 ml-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages || 1, p + 1))}
                disabled={pagination.page >= (pagination.totalPages || 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
