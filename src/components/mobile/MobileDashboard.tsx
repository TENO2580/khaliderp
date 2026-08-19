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
  X,
} from 'lucide-react';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';
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

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

type PeriodKey = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all_time' | 'custom';

export default function MobileDashboard() {
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
    { id: 'this_week', label: 'Week' },
    { id: 'this_month', label: 'Month' },
    { id: 'last_month', label: 'Last M' },
    { id: 'this_year', label: 'Year' },
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
    <div className="space-y-4">
      {/* Date Filter Chips for Mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePeriodSelect(p.id)}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
              period === p.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom Date Picker Bar */}
      {(isCustomOpen || period === 'custom') && (
        <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm dark:bg-gray-900 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-600" /> Date Range
            </span>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setPeriod('this_month');
                  setIsCustomOpen(false);
                }}
                className="text-[11px] text-red-500"
              >
                Reset
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriod('custom');
              }}
              className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriod('custom');
              }}
              className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Metric Grid */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* Mobile Analytics Charts */}
      <div className="space-y-4 pt-2">
        {/* Financial Overview */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Financials ({periodLabel})</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.monthlyFinancials || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{fill: '#94A3B8', fontSize: 11}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#94A3B8', fontSize: 10}} tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: any) => formatCurrency(val)} />
                <Bar dataKey="amount" fill="#3B82F6" barSize={36} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Top Customers ({periodLabel})</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.customerOrders || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{fill: '#94A3B8', fontSize: 9}} angle={-45} textAnchor="end" height={45} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#94A3B8', fontSize: 10}} tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: any) => formatCurrency(val)} />
                <Bar dataKey="TotalSales" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6-Month Sales Trend */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">6-Month Sales Trend</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthlySalesTrend || []}>
                <defs>
                  <linearGradient id="salesGradMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{fill: '#94A3B8', fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#94A3B8', fontSize: 10}} tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val: any) => formatCurrency(val)} />
                <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} fill="url(#salesGradMobile)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
