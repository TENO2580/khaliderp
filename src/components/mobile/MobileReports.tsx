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
export default function MobileReports() {
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
      <div className="space-y-4">
        {rows.map((r: any) => (
          <div key={r.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{r.orderNumber}</div>
                <div className="font-semibold text-gray-900 dark:text-white mt-1">{r.customer}</div>
              </div>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">{r.status}</span>
            </div>
            <div className="text-xs text-gray-500 mb-3">{formatDate(r.date)}</div>
            <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Amount</p>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(r.amount)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Paid</p>
                <p className="font-bold text-sm text-emerald-600">{formatCurrency(r.paid)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Balance</p>
                <p className="font-bold text-sm text-rose-600">{formatCurrency(r.outstanding)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
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
      <div className="space-y-4">
        {rows.map((r: any) => (
          <div key={r.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{r.customerId}</div>
                <div className="font-semibold text-gray-900 dark:text-white mt-1">{r.name}</div>
                <div className="text-xs text-gray-500">{r.phone || '-'} • {r.type}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : r.status === 'LEAD' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'}`}>{r.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Orders</p>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{r.totalOrders}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Revenue</p>
                <p className="font-bold text-sm text-emerald-600">{formatCurrency(r.totalRevenue)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Balance</p>
                <p className="font-bold text-sm text-rose-600">{formatCurrency(r.outstanding)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
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
      <div className="space-y-4">
        {rows.map((r: any, i: number) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <span className="font-semibold text-gray-900 dark:text-white">{r.metric}</span>
            <span className="font-bold text-lg">{r.metric?.includes?.('%') ? `${(r.value || 0).toFixed(1)}%` : formatCurrency(r.value || 0)}</span>
          </div>
        ))}
      </div>
    </>
  );

  const renderExpenseReport = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
        <SummaryCard title="Total Expenses" value={formatCurrency(summary?.totalExpenses || 0)} icon={Receipt} color="rose" />
        <SummaryCard title="Categories" value={summary?.categoryCount || 0} icon={Layers} color="blue" />
      </div>
      <div className="space-y-4">
        {rows.map((r: any, i: number) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div className="font-semibold text-gray-900 dark:text-white">{r.category}</div>
              <div className="font-bold text-rose-600">{formatCurrency(r.amount)}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{r.count} items</span>
              <div className="flex-1">
                <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-800 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${r.percentage || 0}%` }} />
                </div>
              </div>
              <span className="text-xs font-bold w-10 text-right">{(r.percentage || 0).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const renderInventoryReport = () => (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <SummaryCard title="Finished Goods Value" value={formatCurrency(summary?.finishedGoodsValue || 0)} icon={Package} color="blue" />
        <SummaryCard title="Raw Material Value" value={formatCurrency(summary?.rawMaterialValue || 0)} icon={Layers} color="amber" />
        <SummaryCard title="Total Inventory Value" value={formatCurrency(summary?.totalValue || 0)} icon={DollarSign} color="emerald" />
      </div>
      <div className="space-y-4">
        {rows.map((r: any, i: number) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${r.type === 'Finished Good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}>{r.type}</span>
                <div className="font-semibold text-gray-900 dark:text-white mt-1">{r.name}</div>
              </div>
              {r.lowStock ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">Low Stock</span> : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">OK</span>}
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Stock</p>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{r.stock} {r.unit}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Unit Cost</p>
                <p className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(r.unitCost)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Total Value</p>
                <p className="font-bold text-sm text-emerald-600">{formatCurrency(r.totalValue)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
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
      <div className="space-y-4">
        {rows.map((r: any) => (
          <div key={r.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{r.productionNumber}</div>
                <div className="text-xs text-gray-500 font-medium mt-1">Batch: {r.batchNumber}</div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>{formatDate(r.date)}</div>
                <div>{r.shift} Shift</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase">Input</p>
                <p className="font-semibold text-amber-600 text-sm">{r.waxUsed} KG Wax</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase">Output</p>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{r.quantityProduced} KG</p>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="text-xs text-gray-500">{formatCurrency(r.costPerKg)} / KG</div>
              <div className="font-bold text-rose-600">{formatCurrency(r.totalCost)}</div>
            </div>
          </div>
        ))}
      </div>
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
      <div className="space-y-4">
        {rows.map((r: any) => (
          <div key={r.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{r.invoiceNumber}</div>
                <div className="font-semibold text-gray-900 dark:text-white mt-1">{r.customer}</div>
              </div>
              <div className="text-right text-xs text-gray-500">{formatDate(r.date)}</div>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-gray-500">Taxable</span>
              <span className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(r.taxableAmount)}</span>
            </div>
            <div className="flex gap-2 mb-3">
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-2 rounded-lg text-center">
                <div className="text-[10px] text-gray-500 uppercase">CGST</div>
                <div className="font-semibold text-xs text-gray-900 dark:text-white">{formatCurrency(r.cgst)}</div>
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-2 rounded-lg text-center">
                <div className="text-[10px] text-gray-500 uppercase">SGST</div>
                <div className="font-semibold text-xs text-gray-900 dark:text-white">{formatCurrency(r.sgst)}</div>
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-2 rounded-lg text-center">
                <div className="text-[10px] text-gray-500 uppercase">IGST</div>
                <div className="font-semibold text-xs text-gray-900 dark:text-white">{formatCurrency(r.igst)}</div>
              </div>
            </div>
            <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-3">
              <span className="text-xs font-bold uppercase">Total Invoice</span>
              <span className="font-bold text-lg text-emerald-600">{formatCurrency(r.totalAmount)}</span>
            </div>
          </div>
        ))}
      </div>
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
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1 pr-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">Reports & Analytics</h1>
          <p className="text-xs text-gray-500 line-clamp-1">Financial performance and custom exports</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export CSV / Excel
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-gray-900 text-white shadow-md dark:bg-white dark:text-gray-900' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.name}
            </button>
          );
        })}
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
