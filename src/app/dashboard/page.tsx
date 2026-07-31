'use client';

import React, { useEffect, useState } from 'react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import api from '@/lib/api';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get('/dashboard/stats');
        setData(res.data.data);
      } catch {
        // Fallback mock
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  const KPICard = ({ title, value }: { title: string; value: string | number }) => (
    <div className="flex flex-col border border-gray-200 bg-white">
      <div className="bg-[#006677] py-2 px-4 text-center">
        <h3 className="text-sm font-bold text-white uppercase">{title}</h3>
      </div>
      <div className="bg-[#E6F3F5] py-6 px-4 text-center flex-1 flex items-center justify-center">
        <p className="text-3xl font-bold text-[#006677]">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto bg-white min-h-screen pb-10">
      {/* Header */}
      <div className="bg-[#006677] py-3 text-center">
        <h1 className="text-2xl font-bold text-white">Candle Business ERP Dashboard</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Monthly Sales" value={formatCurrency(kpis?.monthlySales || 0)} />
          <KPICard title="Monthly Profit" value={formatCurrency(kpis?.monthlyProfit || 0)} />
          <KPICard title="Avg Margin %" value={`${(kpis?.avgMarginPercent || 0).toFixed(2)}%`} />
          <KPICard title="Total Expenses" value={formatCurrency(kpis?.totalExpenses || 0)} />
          
          <KPICard title="Total Customers" value={formatNumber(kpis?.totalCustomers || 0)} />
          <KPICard title="Active Customers" value={formatNumber(kpis?.activeCustomers || 0)} />
          <KPICard title="Wax Stock" value={formatNumber(kpis?.waxStock || 0)} />
          <KPICard title="Candle Stock" value={formatNumber(kpis?.candleStock || 0)} />
        </div>

        {/* Status Banner */}
        <div className="bg-[#4CAF50] text-white py-1.5 px-4 flex items-center justify-center gap-2 font-bold text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>Stock Levels Healthy</span>
        </div>

        {/* Charts Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Monthly Financial Overview */}
          <div className="border border-gray-300 p-4 bg-white flex flex-col">
            <h3 className="text-lg text-gray-500 font-normal mb-4">Monthly Financial Overview</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.monthlyFinancials || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#666', fontSize: 12}} tickFormatter={(val) => `₹${val}`} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                  <Bar dataKey="amount" fill="#3B82F6" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Order History */}
          <div className="border border-gray-300 p-4 bg-white md:col-span-2 flex flex-col">
            <h3 className="text-lg text-gray-500 font-normal mb-4">Customer Order History</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.customerOrders || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fill: '#666', fontSize: 10}} angle={-45} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                  <Legend wrapperStyle={{fontSize: '12px'}} />
                  <Bar dataKey="TotalSales" fill="#3B82F6" name="Total Sales" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Charts Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Inventory Health */}
          <div className="border border-gray-300 p-4 bg-white flex flex-col">
            <h3 className="text-lg text-gray-500 font-normal mb-4">Inventory Health</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.inventoryHealth || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#3B82F6" barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-gray-500 mt-2">Stock Type</div>
          </div>

          {/* Sales Trend */}
          <div className="border border-gray-300 p-4 bg-white flex flex-col">
            <h3 className="text-lg text-gray-500 font-normal mb-4">Sales Trend</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts?.salesTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} />
                  <XAxis dataKey="date" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(val: any) => formatCurrency(val)} />
                  <Legend wrapperStyle={{fontSize: '12px'}} />
                  <Area type="monotone" dataKey="TotalSales" stroke="#3B82F6" strokeWidth={2} fill="transparent" name="Total Sales" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-xs text-gray-500 mt-2">Order Date</div>
          </div>

          {/* Production vs Sales */}
          <div className="border border-gray-300 p-4 bg-white flex flex-col">
            <h3 className="text-lg text-gray-500 font-normal mb-4">Production vs Sales</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.productionVsSales || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="batchName" tick={{fill: '#666', fontSize: 10}} angle={-45} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#666', fontSize: 12}} tickFormatter={(val) => `${val} KG`} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{fontSize: '12px'}} iconType="square" />
                  <Bar dataKey="Produced" fill="#3B82F6" />
                  <Bar dataKey="Sold" fill="#EF4444" />
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
