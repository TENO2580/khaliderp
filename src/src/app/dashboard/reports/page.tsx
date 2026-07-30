'use client';

import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, PieChart as PieIcon, TrendingUp, Users, DollarSign, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales');

  const reportTabs = [
    { id: 'sales', name: 'Sales Report' },
    { id: 'customer', name: 'Customer Report' },
    { id: 'profit', name: 'Profit & Margin' },
    { id: 'expense', name: 'Expense Report' },
    { id: 'inventory', name: 'Inventory Valuation' },
    { id: 'production', name: 'Production Report' },
    { id: 'gst', name: 'GST Audit Report' },
    { id: 'outstanding', name: 'Outstanding Receivables' },
  ];

  const handleExportCSV = () => {
    toast.success(`Exporting ${activeTab.toUpperCase()} report as CSV...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Advanced Analytics</h1>
          <p className="text-sm text-gray-500">Comprehensive business reports, ABC/RFM customer segmentation & forecasting</p>
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

      {/* Advanced Analytics Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">ABC Inventory Analysis</h3>
            <Layers className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Category A (High Value)</span>
              <span className="font-bold text-blue-600">70% Value (Lavender Soy)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Category B (Moderate)</span>
              <span className="font-bold text-emerald-600">20% Value (Pillar Candles)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Category C (Low)</span>
              <span className="font-bold text-amber-600">10% Value (Small Tea Lights)</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">RFM Customer Segmentation</h3>
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Champions (High RFM)</span>
              <span className="font-bold text-purple-600">24 Customers</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Loyal Customers</span>
              <span className="font-bold text-blue-600">45 Customers</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">At Risk / Inactive</span>
              <span className="font-bold text-rose-600">12 Customers</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">AI Sales Forecast</h3>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹9,45,000</p>
            <p className="text-xs text-gray-500">Projected revenue for Next Month (+11.2% growth trajectory based on historical sales trends)</p>
          </div>
        </div>
      </div>

      {/* Main Report Preview Card */}
      <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">
          {activeTab.toUpperCase()} REPORT PREVIEW
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500 dark:bg-gray-950">
              <tr>
                <th className="px-4 py-3">Metric / Item</th>
                <th className="px-4 py-3">Period Total</th>
                <th className="px-4 py-3">Growth vs Prev Month</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Gross Revenue</td>
                <td className="px-4 py-3 font-bold">{formatCurrency(850000)}</td>
                <td className="px-4 py-3 text-emerald-600 font-semibold">+15.4%</td>
                <td className="px-4 py-3 text-xs text-emerald-600 font-bold">Optimal</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Total Production Output</td>
                <td className="px-4 py-3 font-bold">8,200 KG</td>
                <td className="px-4 py-3 text-emerald-600 font-semibold">+8.1%</td>
                <td className="px-4 py-3 text-xs text-blue-600 font-bold">On Target</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Total Expenses</td>
                <td className="px-4 py-3 font-bold">{formatCurrency(120000)}</td>
                <td className="px-4 py-3 text-rose-600 font-semibold">-3.5%</td>
                <td className="px-4 py-3 text-xs text-gray-500">Normal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
