'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  Users,
  DollarSign,
  Layers,
  Package,
  Factory,
  Receipt,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import useSWR from 'swr';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);
export default function DesktopReports() {
  const [activeTab, setActiveTab] = useState('sales');
  const { data: reportData, isLoading } = useSWR(`/reports?type=${activeTab}`, fetcher);

  const reportTabs = [
    { id: 'sales', name: 'Sales Report', icon: DollarSign },
    { id: 'customer', name: 'Customer Report', icon: Users },
    { id: 'profit', name: 'Profit & Margin', icon: TrendingUp },
    { id: 'expense', name: 'Expense Report', icon: Receipt },
    { id: 'inventory', name: 'Inventory Valuation', icon: Package },
    { id: 'production', name: 'Production Report', icon: Factory },
    { id: 'gst', name: 'GST Audit Report', icon: BarChart3 },
    { id: 'outstanding', name: 'Outstanding Receivables', icon: CreditCard },
  ];

  const handleExportCSV = () => {
    if (!reportData?.rows || reportData.rows.length === 0) {
      toast.error('No data to export');
      return;
    }
    const rows = reportData.rows;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) =>
        headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          return str.includes(',') ? `"${str}"` : str;
        }).join(',')
      ),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success(`${activeTab.toUpperCase()} report exported as CSV!`);
  };

  const summary = reportData?.summary;
  const rows = reportData?.rows || [];

  const SummaryCard = ({ title, value, icon: Icon, color = 'blue' }: { title: string; value: string | number; icon: any; color?: string }) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
      emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
      amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
      rose: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400',
      purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400',
    };
    return (
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</span>
          <div className={`rounded-xl p-2 ${colorMap[color] || colorMap.blue}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    );
  };

  const renderSalesReport = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total Revenue" value={formatCurrency(summary?.totalRevenue || 0)} icon={DollarSign} color="emerald" />
        <SummaryCard title="Total Paid" value={formatCurrency(summary?.totalPaid || 0)} icon={CreditCard} color="blue" />
        <SummaryCard title="Outstanding" value={formatCurrency(summary?.totalOutstanding || 0)} icon={AlertTriangle} color="rose" />
        <SummaryCard title="Total Orders" value={summary?.orderCount || 0} icon={Layers} color="purple" />
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Order #</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Paid</th>
            <th className="px-4 py-3">Outstanding</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
          {rows.map((r: any) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{r.orderNumber}</td>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.customer}</td>
              <td className="px-4 py-3 text-xs">{formatDate(r.date)}</td>
              <td className="px-4 py-3 font-bold">{formatCurrency(r.amount)}</td>
              <td className="px-4 py-3 text-emerald-600 font-semibold">{formatCurrency(r.paid)}</td>
              <td className="px-4 py-3 text-rose-600 font-semibold">{formatCurrency(r.outstanding)}</td>
              <td className="px-4 py-3"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderCustomerReport = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <SummaryCard title="Total Customers" value={summary?.total || 0} icon={Users} color="blue" />
        <SummaryCard title="Active" value={summary?.active || 0} icon={Users} color="emerald" />
        <SummaryCard title="Leads" value={summary?.leads || 0} icon={Users} color="amber" />
        <SummaryCard title="Inactive / Lost" value={summary?.inactive || 0} icon={Users} color="rose" />
        <SummaryCard title="Total Outstanding" value={formatCurrency(summary?.totalOutstanding || 0)} icon={CreditCard} color="purple" />
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Orders</th>
            <th className="px-4 py-3">Revenue</th>
            <th className="px-4 py-3">Outstanding</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
          {rows.map((r: any) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{r.customerId}</td>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.name}</td>
              <td className="px-4 py-3 text-xs">{r.phone || '-'}</td>
              <td className="px-4 py-3 text-xs">{r.type}</td>
              <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : r.status === 'LEAD' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>{r.status}</span></td>
              <td className="px-4 py-3 font-bold">{r.totalOrders}</td>
              <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(r.totalRevenue)}</td>
              <td className="px-4 py-3 font-bold text-rose-600">{formatCurrency(r.outstanding)}</td>
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
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Total Amount</th>
            <th className="px-4 py-3">Count</th>
            <th className="px-4 py-3">% of Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
          {rows.map((r: any, i: number) => (
            <tr key={i}>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.category}</td>
              <td className="px-4 py-3 font-bold text-rose-600">{formatCurrency(r.amount)}</td>
              <td className="px-4 py-3">{r.count}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full dark:bg-gray-800 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${r.percentage || 0}%` }} />
                  </div>
                  <span className="text-xs font-bold">{(r.percentage || 0).toFixed(1)}%</span>
                </div>
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
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Item Name</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Unit Cost</th>
            <th className="px-4 py-3">Total Value</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
          {rows.map((r: any, i: number) => (
            <tr key={i}>
              <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.type === 'Finished Good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}>{r.type}</span></td>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.name}</td>
              <td className="px-4 py-3 font-bold">{r.stock} {r.unit}</td>
              <td className="px-4 py-3">{formatCurrency(r.unitCost)}</td>
              <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(r.totalValue)}</td>
              <td className="px-4 py-3">{r.lowStock ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">Low Stock</span> : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">OK</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderProductionReport = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total Runs" value={summary?.totalProductions || 0} icon={Factory} color="blue" />
        <SummaryCard title="Total Output" value={`${(summary?.totalQty || 0).toLocaleString()} KG`} icon={Layers} color="emerald" />
        <SummaryCard title="Total Cost" value={formatCurrency(summary?.totalCost || 0)} icon={DollarSign} color="rose" />
        <SummaryCard title="Avg Cost/KG" value={formatCurrency(summary?.avgCostPerKg || 0)} icon={TrendingUp} color="purple" />
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Prod #</th>
            <th className="px-4 py-3">Batch #</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Shift</th>
            <th className="px-4 py-3">Wax Used</th>
            <th className="px-4 py-3">Output</th>
            <th className="px-4 py-3">Cost/KG</th>
            <th className="px-4 py-3">Total Cost</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
          {rows.map((r: any) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{r.productionNumber}</td>
              <td className="px-4 py-3 text-xs font-medium">{r.batchNumber}</td>
              <td className="px-4 py-3 text-xs">{formatDate(r.date)}</td>
              <td className="px-4 py-3 text-xs">{r.shift}</td>
              <td className="px-4 py-3 font-semibold text-amber-600">{r.waxUsed} KG</td>
              <td className="px-4 py-3 font-bold">{r.quantityProduced} KG</td>
              <td className="px-4 py-3">{formatCurrency(r.costPerKg)}</td>
              <td className="px-4 py-3 font-bold text-rose-600">{formatCurrency(r.totalCost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderGstReport = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard title="Total Taxable" value={formatCurrency(summary?.totalTaxable || 0)} icon={DollarSign} color="blue" />
        <SummaryCard title="CGST" value={formatCurrency(summary?.totalCgst || 0)} icon={Receipt} color="emerald" />
        <SummaryCard title="SGST" value={formatCurrency(summary?.totalSgst || 0)} icon={Receipt} color="amber" />
        <SummaryCard title="Total GST" value={formatCurrency(summary?.totalGst || 0)} icon={Receipt} color="rose" />
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Invoice #</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Taxable Amt</th>
            <th className="px-4 py-3">CGST</th>
            <th className="px-4 py-3">SGST</th>
            <th className="px-4 py-3">IGST</th>
            <th className="px-4 py-3">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
          {rows.map((r: any) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{r.invoiceNumber}</td>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.customer}</td>
              <td className="px-4 py-3 text-xs">{formatDate(r.date)}</td>
              <td className="px-4 py-3 font-bold">{formatCurrency(r.taxableAmount)}</td>
              <td className="px-4 py-3">{formatCurrency(r.cgst)}</td>
              <td className="px-4 py-3">{formatCurrency(r.sgst)}</td>
              <td className="px-4 py-3">{formatCurrency(r.igst)}</td>
              <td className="px-4 py-3 font-bold text-emerald-600">{formatCurrency(r.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderOutstandingReport = () => (
    <>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SummaryCard title="Total Outstanding" value={formatCurrency(summary?.totalOutstanding || 0)} icon={AlertTriangle} color="rose" />
        <SummaryCard title="Customers with Dues" value={summary?.customersWithDues || 0} icon={Users} color="amber" />
      </div>
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Customer ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Outstanding</th>
            <th className="px-4 py-3">Credit Limit</th>
            <th className="px-4 py-3">Unpaid Invoices</th>
            <th className="px-4 py-3">Oldest Due</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
          {rows.map((r: any) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{r.customerId}</td>
              <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{r.name}</td>
              <td className="px-4 py-3 text-xs">{r.phone || '-'}</td>
              <td className="px-4 py-3 font-bold text-rose-600">{formatCurrency(r.outstanding)}</td>
              <td className="px-4 py-3">{formatCurrency(r.creditLimit)}</td>
              <td className="px-4 py-3 font-bold">{r.invoiceCount}</td>
              <td className="px-4 py-3 text-xs">{r.oldestDue ? formatDate(r.oldestDue) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  const renderReportContent = () => {
    switch (activeTab) {
      case 'sales': return renderSalesReport();
      case 'customer': return renderCustomerReport();
      case 'profit': return renderProfitReport();
      case 'expense': return renderExpenseReport();
      case 'inventory': return renderInventoryReport();
      case 'production': return renderProductionReport();
      case 'gst': return renderGstReport();
      case 'outstanding': return renderOutstandingReport();
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
