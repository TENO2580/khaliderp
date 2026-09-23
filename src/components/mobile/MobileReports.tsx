'use client';

import React, { useState, useEffect } from 'react';
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
    <div className={`rounded-xl border border-${color}-100 bg-${color}-50/30 p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/50`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate pr-2">{title}</p>
        <Icon className={`h-3.5 w-3.5 text-${color}-600 dark:text-${color}-400 flex-shrink-0`} />
      </div>
      <h3 className="text-lg font-black text-gray-900 dark:text-white truncate">{value}</h3>
    </div>
  );
};

export default function MobileReports() {
  const [activeTab, setActiveTab] = useState('sales');

  const reportTabs = [
    { id: 'sales', name: 'Sales', icon: DollarSign },
    { id: 'profit', name: 'Profit', icon: TrendingUp },
    { id: 'expense', name: 'Expense', icon: Receipt },
    { id: 'inventory', name: 'Inventory', icon: Package },
  ];

  const { data: reportData, error, isLoading } = useSWR(`/api/reports?type=${activeTab}`, fetcher);
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
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SummaryCard title="Total Revenue" value={formatCurrency(summary?.totalRevenue || 0)} icon={DollarSign} color="emerald" />
        <SummaryCard title="Total Paid" value={formatCurrency(summary?.totalPaid || 0)} icon={Receipt} color="blue" />
        <SummaryCard title="Outstanding" value={formatCurrency(summary?.totalOutstanding || 0)} icon={TrendingUp} color="rose" />
        <SummaryCard title="Total Orders" value={summary?.orderCount || 0} icon={Package} color="purple" />
      </div>
      <div className="space-y-4">
        {rows.map((r: any, i: number) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-mono text-xs font-bold text-gray-400">#{r.rank}</div>
                <div className="font-semibold text-gray-900 dark:text-white mt-1">{r.customer}</div>
              </div>
              <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-bold dark:bg-blue-950/40 dark:text-blue-400">{r.contribution}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Orders</p>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{r.orders}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Revenue</p>
                <p className="font-bold text-sm text-emerald-600">{formatCurrency(r.revenue)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderProfitReport = () => (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SummaryCard title="Revenue" value={formatCurrency(summary?.revenue || 0)} icon={DollarSign} color="emerald" />
        <SummaryCard title="Gross Profit" value={formatCurrency(summary?.grossProfit || 0)} icon={TrendingUp} color="blue" />
        <SummaryCard title="Net Profit" value={formatCurrency(summary?.netProfit || 0)} icon={TrendingUp} color={summary?.netProfit >= 0 ? 'emerald' : 'rose'} />
        <SummaryCard title="Gross Margin" value={`${(summary?.grossMargin || 0).toFixed(1)}%`} icon={BarChart3} color="purple" />
      </div>
      <div className="space-y-4">
        {rows.map((r: any, i: number) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{r.metric}</span>
            <span className="font-bold text-base">{r.metric?.includes?.('%') ? `${(r.value || 0).toFixed(1)}%` : formatCurrency(r.value || 0)}</span>
          </div>
        ))}
      </div>
    </>
  );

  const renderExpenseReport = () => (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SummaryCard title="Total Expenses" value={formatCurrency(summary?.totalExpenses || 0)} icon={Receipt} color="rose" />
        <SummaryCard title="Categories" value={summary?.categoryCount || 0} icon={Layers} color="blue" />
      </div>
      <div className="space-y-4">
        {rows.map((r: any, i: number) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col">
                 <span className="font-mono text-[10px] font-bold text-gray-400">#{r.rank}</span>
                 <span className="font-semibold text-gray-900 dark:text-white mt-1">{r.category}</span>
              </div>
              <div className="font-bold text-rose-600">{formatCurrency(r.amount)}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500">{r.expenseCount} items</span>
              <div className="flex-1">
                <div className="w-full h-1.5 bg-gray-200 rounded-full dark:bg-gray-800 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: r.contribution.replace('%', '') + '%' }} />
                </div>
              </div>
              <span className="text-[10px] font-bold w-10 text-right">{r.contribution}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderInventoryReport = () => (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SummaryCard title="Finished Goods" value={formatCurrency(summary?.finishedGoodsValue || 0)} icon={Package} color="blue" />
        <SummaryCard title="Raw Material" value={formatCurrency(summary?.rawMaterialValue || 0)} icon={Layers} color="amber" />
        <div className="col-span-2">
           <SummaryCard title="Total Inventory Value" value={formatCurrency(summary?.totalValue || 0)} icon={DollarSign} color="emerald" />
        </div>
      </div>
      <div className="space-y-4">
        {rows.map((r: any, i: number) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.type === 'Top Finished Good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}>{r.type}</span>
                <div className="font-semibold text-gray-900 dark:text-white mt-1 text-sm">{r.item}</div>
              </div>
              <span className="font-mono text-[10px] font-bold text-gray-400 mt-1">#{r.rank}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Stock</p>
                <p className="font-bold text-xs text-gray-900 dark:text-white">{r.stock}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Unit Cost</p>
                <p className="font-bold text-xs text-gray-900 dark:text-white">{formatCurrency(r.unitCost)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Total Value</p>
                <p className="font-bold text-xs text-emerald-600">{formatCurrency(r.totalValue)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
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
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-xs text-gray-500">Business analytics</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-500 transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[72px] h-[72px] rounded-2xl border transition-all ${
                isActive
                  ? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950/30 dark:text-blue-400 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
              }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
              <span className="text-[10px] font-bold">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      <div className="pt-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-xs text-gray-500">Loading data...</p>
          </div>
        ) : emptyState ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <BarChart3 className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">No Data</h3>
            <p className="mt-1 text-[10px] text-gray-500">No records found for this report.</p>
          </div>
        ) : (
          renderReportContent()
        )}
      </div>
    </div>
  );
}
