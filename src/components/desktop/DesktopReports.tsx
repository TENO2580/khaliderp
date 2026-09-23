'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Package,
  Receipt,
  Layers,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import useSWR from 'swr';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

const SummaryCard = ({ title, value, icon: Icon, color }: any) => {
  return (
    <div className={`rounded-xl border border-${color}-100 bg-${color}-50/30 p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/50`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</p>
        <div className={`rounded-lg bg-${color}-100 p-2 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <h3 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{value}</h3>
    </div>
  );
};

export default function DesktopReports() {
  const [activeTab, setActiveTab] = useState('sales');

  const reportTabs = [
    { id: 'sales', name: 'Sales Report', icon: DollarSign },
    { id: 'profit', name: 'Profit & Margin', icon: TrendingUp },
    { id: 'expense', name: 'Expense Report', icon: Receipt },
    { id: 'inventory', name: 'Inventory Valuation', icon: Package },
  ];

  const { data: reportData, error, isLoading } = useSWR(`/reports?type=${activeTab}`, fetcher);
  const rows = reportData?.rows || [];
  const summary = reportData?.summary || {};

  const handleExportCSV = () => {
    if (!reportData?.rows || reportData.rows.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) =>
          headers.map((h) => {
            const val = row[h];
            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report exported successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV');
    }
  };

  const renderSalesReport = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total Revenue" value={formatCurrency(summary?.totalRevenue || 0)} icon={DollarSign} color="emerald" />
        <SummaryCard title="Total Paid" value={formatCurrency(summary?.totalPaid || 0)} icon={Receipt} color="blue" />
        <SummaryCard title="Outstanding" value={formatCurrency(summary?.totalOutstanding || 0)} icon={TrendingUp} color="rose" />
        <SummaryCard title="Total Orders" value={summary?.orderCount || 0} icon={Package} color="purple" />
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Orders</th>
            <th className="px-4 py-3">Revenue</th>
            <th className="px-4 py-3">Contribution</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
          {rows.map((r: any, i: number) => (
            <tr key={i}>
              <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">#{r.rank}</td>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.customer}</td>
              <td className="px-4 py-3">{r.orders}</td>
              <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(r.revenue)}</td>
              <td className="px-4 py-3 text-xs font-bold text-blue-600">{r.contribution}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderProfitReport = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Revenue" value={formatCurrency(summary?.revenue || 0)} icon={DollarSign} color="emerald" />
        <SummaryCard title="Gross Profit" value={formatCurrency(summary?.grossProfit || 0)} icon={TrendingUp} color="blue" />
        <SummaryCard title="Net Profit" value={formatCurrency(summary?.netProfit || 0)} icon={TrendingUp} color={summary?.netProfit >= 0 ? 'emerald' : 'rose'} />
        <SummaryCard title="Gross Margin" value={`${(summary?.grossMargin || 0).toFixed(1)}%`} icon={BarChart3} color="purple" />
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Metric</th>
            <th className="px-4 py-3">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
          {rows.map((r: any, i: number) => (
            <tr key={i}>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.metric}</td>
              <td className="px-4 py-3 font-bold">{r.metric?.includes?.('%') ? `${(r.value || 0).toFixed(1)}%` : formatCurrency(r.value || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderExpenseReport = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        <SummaryCard title="Total Expenses" value={formatCurrency(summary?.totalExpenses || 0)} icon={Receipt} color="rose" />
        <SummaryCard title="Categories" value={summary?.categoryCount || 0} icon={Layers} color="blue" />
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Total Amount</th>
            <th className="px-4 py-3">Count</th>
            <th className="px-4 py-3">% of Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
          {rows.map((r: any, i: number) => (
            <tr key={i}>
              <td className="px-4 py-3 font-mono text-xs font-bold text-gray-400">#{r.rank}</td>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.category}</td>
              <td className="px-4 py-3 font-bold text-rose-600">{formatCurrency(r.amount)}</td>
              <td className="px-4 py-3">{r.expenseCount}</td>
              <td className="px-4 py-3">
                <span className="text-xs font-bold">{r.contribution}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderInventoryReport = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="Finished Goods Value" value={formatCurrency(summary?.finishedGoodsValue || 0)} icon={Package} color="blue" />
        <SummaryCard title="Raw Material Value" value={formatCurrency(summary?.rawMaterialValue || 0)} icon={Layers} color="amber" />
        <SummaryCard title="Total Inventory Value" value={formatCurrency(summary?.totalValue || 0)} icon={DollarSign} color="emerald" />
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Item Name</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Unit Cost</th>
            <th className="px-4 py-3">Total Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
          {rows.map((r: any, i: number) => (
            <tr key={i}>
              <td className="px-4 py-3 font-mono text-xs font-bold text-gray-400">#{r.rank}</td>
              <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.type === 'Top Finished Good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}>{r.type}</span></td>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.item}</td>
              <td className="px-4 py-3 font-bold">{r.stock}</td>
              <td className="px-4 py-3">{formatCurrency(r.unitCost)}</td>
              <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(r.totalValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderReportContent = () => {
    switch (activeTab) {
      case 'sales': return renderSalesReport();
      case 'profit': return renderProfitReport();
      case 'expense': return renderExpenseReport();
      case 'inventory': return renderInventoryReport();
      default: return null;
    }
  };

  const emptyState = !isLoading && rows.length === 0 && !['profit'].includes(activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Advanced Analytics</h1>
          <p className="text-sm text-gray-500">Comprehensive business reports powered by your live Supabase data</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export CSV / Excel
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 rounded-2xl bg-gray-200/60 p-1.5 dark:bg-gray-900 overflow-x-auto">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-sm text-gray-500">Loading report data...</p>
          </div>
        ) : emptyState ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-700" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No Data Yet</h3>
            <p className="mt-1 text-sm text-gray-500">Start adding records in the respective modules to see report data here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">{renderReportContent()}</div>
        )}
      </div>
    </div>
  );
}
