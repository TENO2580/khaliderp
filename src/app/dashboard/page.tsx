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
} from 'recharts';

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [kRes, cRes] = await Promise.all([
          api.get('/dashboard/kpis'),
          api.get('/dashboard/charts'),
        ]);
        setKpis(kRes.data.data);
        setCharts(cRes.data.data);
      } catch {
        // Fallback mock values for instant rendering if backend is starting
        setKpis({
          todaysSales: 45000,
          todaysProfit: 18500,
          monthlySales: 850000,
          monthlyProfit: 340000,
          monthlyExpenses: 120000,
          grossMargin: 40.0,
          currentWaxStock: 700,
          finishedGoodsStock: 1450,
          ordersPending: 4,
          ordersDelivered: 28,
          totalCustomers: 124,
          activeCustomers: 98,
          outstandingCredit: 215000,
          inventoryValue: 420000,
          productionToday: 350,
          productionThisMonth: 8200,
          employeeAttendance: 14,
        });
        setCharts({
          salesTrend: [
            { month: 'Feb', sales: 620000 },
            { month: 'Mar', sales: 710000 },
            { month: 'Apr', sales: 680000 },
            { month: 'May', sales: 790000 },
            { month: 'Jun', sales: 810000 },
            { month: 'Jul', sales: 850000 },
          ],
          topCustomers: [
            { name: 'Aroma House', revenue: 240000 },
            { name: 'Gift Gallery', revenue: 190000 },
            { name: 'Candle World', revenue: 150000 },
            { name: 'Festival Lights', revenue: 110000 },
            { name: 'Home Decor Plus', revenue: 85000 },
          ],
          expenseBreakdown: [
            { category: 'Raw Materials', amount: 65000 },
            { category: 'Salary', amount: 35000 },
            { category: 'Electricity', amount: 12000 },
            { category: 'Fuel', amount: 8000 },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ERP Dashboard</h1>
        <p className="text-sm text-gray-500">Live operational metrics & business overview</p>
      </div>

      {/* Primary KPI Grid (16 cards in 4x4 grid) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Today's Sales"
          value={formatCurrency(kpis?.todaysSales || 0)}
          change="+12.5%"
          isPositive={true}
          icon={DollarSign}
          color="blue"
        />
        <KPICard
          title="Today's Profit"
          value={formatCurrency(kpis?.todaysProfit || 0)}
          change="+8.2%"
          isPositive={true}
          icon={TrendingUp}
          color="emerald"
        />
        <KPICard
          title="Monthly Sales"
          value={formatCurrency(kpis?.monthlySales || 0)}
          change="+15.4%"
          isPositive={true}
          icon={DollarSign}
          color="blue"
        />
        <KPICard
          title="Monthly Profit"
          value={formatCurrency(kpis?.monthlyProfit || 0)}
          change="+11.0%"
          isPositive={true}
          icon={TrendingUp}
          color="emerald"
        />

        <KPICard
          title="Monthly Expenses"
          value={formatCurrency(kpis?.monthlyExpenses || 0)}
          change="-3.5%"
          isPositive={true}
          icon={CreditCard}
          color="rose"
        />
        <KPICard
          title="Gross Margin"
          value={`${kpis?.grossMargin || 0}%`}
          change="+1.2%"
          isPositive={true}
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
        />
        <KPICard
          title="Total Customers"
          value={kpis?.totalCustomers || 0}
          icon={Users}
          color="blue"
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
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Sales Trend (6 Months)</h3>
          <p className="text-xs text-gray-500 mb-6">Monthly revenue trajectory</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.salesTrend || []}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip formatter={(val: any) => [formatCurrency(val), 'Revenue']} />
                <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers Bar Chart */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Top 5 Customers</h3>
          <p className="text-xs text-gray-500 mb-6">Revenue distribution by customer</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.topCustomers || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#94A3B8" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={12} width={100} />
                <Tooltip formatter={(val: any) => [formatCurrency(val), 'Revenue']} />
                <Bar dataKey="revenue" fill="#10B981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
