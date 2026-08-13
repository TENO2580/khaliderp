'use client';

import React, { useEffect, useState } from 'react';
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

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

export default function MobileDashboard() {
  const { data, isLoading, error } = useSWR('/dashboard/stats', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  const kpis = data?.kpis;
  const charts = data?.charts;

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const salesChange = kpis?.salesChange ?? 0;
  const expenseChange = kpis?.expenseChange ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-500">Loading real-time data…</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title removed since MobileTopBar handles it */}

      {/* Primary KPI Grid (2x2 grid for mobile) */}
      <div className="grid grid-cols-2 gap-3">
        <KPICard
          title="Today's Sales"
          value={formatCurrency(kpis?.todaysSales || 0)}
          change={salesChange !== 0 ? `${salesChange > 0 ? '+' : ''}${salesChange}%` : undefined}
          isPositive={salesChange >= 0}
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
          title="Monthly Sales"
          value={formatCurrency(kpis?.monthlySales || 0)}
          change={salesChange !== 0 ? `${salesChange > 0 ? '+' : ''}${salesChange}%` : undefined}
          isPositive={salesChange >= 0}
          icon={DollarSign}
          color="blue"
          subtitle="vs. last month"
        />
        <KPICard
          title="Monthly Profit"
          value={formatCurrency(kpis?.monthlyProfit || 0)}
          icon={TrendingUp}
          color="emerald"
        />

        <KPICard
          title="Monthly Expenses"
          value={formatCurrency(kpis?.monthlyExpenses || 0)}
          change={expenseChange !== 0 ? `${expenseChange > 0 ? '+' : ''}${expenseChange}%` : undefined}
          isPositive={expenseChange <= 0}
          icon={CreditCard}
          color="rose"
          subtitle="vs. last month"
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
          subtitle="This month"
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
          title="Production This Month"
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
          
          {/* Monthly Financial Overview */}
          <div className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Monthly Financial Overview</h3>
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
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Top Customers by Revenue</h3>
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
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Expense Breakdown (This Month)</h3>
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

          {/* Sales Trend (7 Days) */}
          <div className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sales Trend (7 Days)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts?.salesTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{fill: '#94A3B8', fontSize: 12}} axisLine={false} tickLine={false} />
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
    </div>
  );
}
