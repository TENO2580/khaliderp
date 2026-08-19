'use client';

import React, { useState } from 'react';
import KPICard from '@/components/shared/KPICard';
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  Factory,
  CreditCard,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Filter,
  X,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import api from '@/lib/api';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import useSWR from 'swr';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

type PeriodKey = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all_time' | 'custom';

export default function DesktopDashboard() {
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const queryUrl = `/dashboard/stats?period=${period}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`;

  const { data, isLoading, error } = useSWR(queryUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  const kpis = data?.kpis;
  const charts = data?.charts;
  const periodInfo = data?.periodInfo;

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const salesChange = kpis?.salesChange ?? 0;
  const expenseChange = kpis?.expenseChange ?? 0;

  const periodLabel = periodInfo?.label || 'This Month';

  const periods: { id: PeriodKey; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_quarter', label: 'This Quarter' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all_time', label: 'All Time' },
    { id: 'custom', label: 'Custom' },
  ];

  const handlePeriodSelect = (p: PeriodKey) => {
    setPeriod(p);
    if (p === 'custom') {
      setIsCustomOpen(true);
    } else {
      setIsCustomOpen(false);
      setStartDate('');
      setEndDate('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ERP Dashboard</h1>
          <p className="text-sm text-gray-500">Live operational metrics & business overview</p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl dark:bg-gray-900/80 border border-gray-200/60 dark:border-gray-800/60">
          <div className="flex items-center gap-1 overflow-x-auto">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => handlePeriodSelect(p.id)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all',
                  period === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/60'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Bar */}
      {(isCustomOpen || period === 'custom') && (
        <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Select Date Range:</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriod('custom');
              }}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-blue-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
            <span className="text-xs text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriod('custom');
              }}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-blue-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setPeriod('this_month');
                setIsCustomOpen(false);
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 dark:hover:text-red-400 ml-auto"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset to Default</span>
            </button>
          )}
        </div>
      )}

      {/* Date Range Feedback Pill */}
      {periodInfo?.startDate && periodInfo?.endDate && (
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            <span>
              Showing metrics for <strong className="text-gray-800 dark:text-gray-200">{periodLabel}</strong> ({periodInfo.startDate} to {periodInfo.endDate})
            </span>
          </div>
          {isLoading && <span className="text-blue-600 dark:text-blue-400 animate-pulse font-medium">Updating metrics...</span>}
        </div>
      )}

      {isLoading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200/80 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-3" />
              <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Primary KPI Grid (16 cards in 4x4 grid) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Today's Sales"
              value={formatCurrency(kpis?.todaysSales || 0)}
              icon={DollarSign}
              color="blue"
            />
            <KPICard
              title="Today's Profit"
              value={formatCurrency(kpis?.todaysProfit || 0)}
              icon={TrendingUp}
              color="emerald"
            />
            <KPICard
              title={`${periodLabel} Sales`}
              value={formatCurrency(kpis?.monthlySales || 0)}
              change={salesChange !== 0 ? `${salesChange > 0 ? '+' : ''}${salesChange}%` : undefined}
              isPositive={salesChange >= 0}
              icon={DollarSign}
              color="blue"
              subtitle="vs. previous period"
            />
            <KPICard
              title={`${periodLabel} Profit`}
              value={formatCurrency(kpis?.monthlyProfit || 0)}
              icon={TrendingUp}
              color="emerald"
            />

            <KPICard
              title={`${periodLabel} Expenses`}
              value={formatCurrency(kpis?.monthlyExpenses || 0)}
              change={expenseChange !== 0 ? `${expenseChange > 0 ? '+' : ''}${expenseChange}%` : undefined}
              isPositive={expenseChange <= 0}
              icon={CreditCard}
              color="rose"
              subtitle="vs. previous period"
            />
            <KPICard
              title="Gross Margin"
              value={`${kpis?.grossMargin || 0}%`}
              icon={TrendingUp}
              color="purple"
            />
            <KPICard
              title="Current Wax Stock"
              value={`${formatNumber(kpis?.currentWaxStock || 0)} KG`}
              icon={Flame}
              color="amber"
              subtitle="Main raw material"
            />
            <KPICard
              title="Finished Goods Stock"
              value={`${formatNumber(kpis?.finishedGoodsStock || 0)} PCS`}
              icon={Package}
              color="blue"
            />

            <KPICard
              title="Orders Pending"
              value={kpis?.ordersPending || 0}
              icon={AlertTriangle}
              color="amber"
            />
            <KPICard
              title="Orders Delivered"
              value={kpis?.ordersDelivered || 0}
              icon={CheckCircle2}
              color="emerald"
              subtitle={periodLabel}
            />
            <KPICard
              title="Total Customers"
              value={kpis?.totalCustomers || 0}
              icon={Users}
              color="blue"
              subtitle={`${kpis?.activeCustomers || 0} active`}
            />
            <KPICard
              title="Outstanding Credit"
              value={formatCurrency(kpis?.outstandingCredit || 0)}
              icon={CreditCard}
              color="rose"
              subtitle="Receivables to collect"
            />

            <KPICard
              title="Inventory Value"
              value={formatCurrency(kpis?.inventoryValue || 0)}
              icon={Layers}
              color="purple"
            />
            <KPICard
              title="Production Today"
              value={`${formatNumber(kpis?.productionToday || 0)} KG`}
              icon={Factory}
              color="blue"
            />
            <KPICard
              title={`Production (${periodLabel})`}
              value={`${formatNumber(kpis?.productionThisMonth || 0)} KG`}
              icon={Factory}
              color="emerald"
            />
            <KPICard
              title="Employee Attendance"
              value={`${kpis?.employeeAttendance || 0} Present`}
              icon={Users}
              color="green"
              subtitle="Today"
            />
          </div>

          {/* Analytics Charts */}
          <div className="space-y-6">
            {/* Charts Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Financial Overview */}
              <div className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Financial Overview ({periodLabel})</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.monthlyFinancials || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{fill: '#94A3B8', fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#94A3B8', fontSize: 12}} tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(val: any) => formatCurrency(val)} />
                      <Bar dataKey="amount" fill="#3B82F6" barSize={40} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Customer Order History */}
              <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] md:col-span-2 flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Top Customers by Revenue ({periodLabel})</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.customerOrders || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{fill: '#94A3B8', fontSize: 10}} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#94A3B8', fontSize: 12}} tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(val: any) => formatCurrency(val)} />
                      <Legend wrapperStyle={{fontSize: '12px'}} />
                      <Bar dataKey="TotalSales" fill="#3B82F6" name="Total Sales" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* Charts Middle Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expense Breakdown */}
              <div className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Expense Breakdown ({periodLabel})</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts?.expenseBreakdown || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="amount"
                        nameKey="category"
                        label={({ category, percent }: any) => `${category} ${(percent * 100).toFixed(0)}%`}
                        labelLine={true}
                      >
                        {(charts?.expenseBreakdown || []).map((_: any, index: number) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => formatCurrency(val)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 6-Month Sales Trend */}
              <div className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">6-Month Sales Trend</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts?.monthlySalesTrend || []}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" tick={{fill: '#94A3B8', fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#94A3B8', fontSize: 12}} tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(val: any) => formatCurrency(val)} />
                      <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} fill="url(#salesGradient)" name="Sales" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Inventory Health */}
              <div className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Inventory Health</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.inventoryHealth || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{fill: '#94A3B8', fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#94A3B8', fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="amount" fill="#3B82F6" barSize={60} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-xs text-gray-500 mt-2">Stock Type</div>
              </div>

              {/* Sales Trend (Period) */}
              <div className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sales Trend ({periodLabel})</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts?.salesTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#E2E8F0" />
                      <XAxis dataKey="date" tick={{fill: '#94A3B8', fontSize: 10}} angle={-45} textAnchor="end" height={45} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#94A3B8', fontSize: 12}} tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(val: any) => formatCurrency(val)} />
                      <Legend wrapperStyle={{fontSize: '12px'}} />
                      <Area type="monotone" dataKey="TotalSales" stroke="#3B82F6" strokeWidth={2} fill="transparent" name="Total Sales" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-xs text-gray-500 mt-2">Order Date</div>
              </div>

              {/* Production vs Sales */}
              <div className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Production vs Sales</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts?.productionVsSales || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="batchName" tick={{fill: '#94A3B8', fontSize: 10}} angle={-45} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#94A3B8', fontSize: 12}} tickFormatter={(val) => `${val} KG`} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Legend wrapperStyle={{fontSize: '12px'}} iconType="square" />
                      <Bar dataKey="Produced" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Sold" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-xs text-gray-500 mt-2 transform -translate-y-2">Batch Name</div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
