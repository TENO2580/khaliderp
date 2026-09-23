'use client';

import React, { useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, AlertCircle, ArrowUpRight, ArrowDownRight, CheckCircle2, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import api from '@/lib/api';
import { useViewMode } from '@/hooks/useViewMode';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

export default function OverdueModule({ isMobile }: { isMobile?: boolean }) {
  const { viewMode } = useViewMode();
  const [settlingId, setSettlingId] = useState<string | null>(null);
  
  const { data: overdueData, isLoading, mutate } = useSWR('/accounts/overdue', fetcher);
  const items = overdueData || [];

  const handleSettle = async (id: string, type: string) => {
    try {
      setSettlingId(id);
      await api.post('/accounts/overdue/settle', { id, type });
      await mutate();
    } catch (error) {
      console.error('Failed to settle account', error);
      alert('Failed to settle account. Please try again.');
    } finally {
      setSettlingId(null);
    }
  };

  const handleExport = () => {
    if (!items.length) return;
    
    const headers = ['Type', 'Reference', 'Entity', 'Phone', 'Order Date', 'Due Date', 'Total Amount', 'Paid Amount', 'Outstanding', 'Days Overdue'];
    const csvContent = [
      headers.join(','),
      ...items.map((i: any) => [
        i.type,
        i.referenceNumber,
        `"${i.entityName}"`,
        i.entityPhone || '',
        new Date(i.date).toLocaleDateString(),
        i.dueDate ? new Date(i.dueDate).toLocaleDateString() : '',
        i.totalAmount,
        i.paidAmount,
        i.outstanding,
        i.daysOverdue
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `overdue_accounts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<any>[] = [
    {
      header: 'Type',
      accessorKey: 'type',
      sortable: true,
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {row.type === 'RECEIVABLE' ? (
            <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10 dark:bg-emerald-900/50 dark:text-emerald-200 dark:ring-emerald-500/20">
              <ArrowDownRight className="h-3 w-3" />
              To Receive
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/10 dark:bg-rose-900/50 dark:text-rose-200 dark:ring-rose-500/20">
              <ArrowUpRight className="h-3 w-3" />
              To Pay
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Reference #',
      accessorKey: 'referenceNumber',
      sortable: true,
      cell: (row: any) => (
        <span className="font-medium text-gray-900 dark:text-white">{row.referenceNumber}</span>
      ),
    },
    {
      header: 'Customer / Supplier',
      accessorKey: 'entityName',
      sortable: true,
      cell: (row: any) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white uppercase">{row.entityName}</div>
          {row.entityPhone && <div className="text-xs text-gray-500">{row.entityPhone}</div>}
        </div>
      ),
    },
    {
      header: 'Dates',
      accessorKey: 'dueDate',
      sortable: true,
      cell: (row: any) => (
        <div>
          <div className="text-sm font-medium text-red-600 dark:text-red-400">
            Due: {formatDate(row.dueDate)}
          </div>
          <div className="text-xs text-gray-500">
            Order: {formatDate(row.date)}
          </div>
        </div>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'totalAmount',
      sortable: true,
      cell: (row: any) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{formatCurrency(row.totalAmount)}</div>
          <div className="text-xs text-gray-500">Paid: {formatCurrency(row.paidAmount)}</div>
        </div>
      ),
    },
    {
      header: 'Outstanding',
      accessorKey: 'outstanding',
      sortable: true,
      cell: (row: any) => (
        <span className={`font-semibold ${row.type === 'RECEIVABLE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {formatCurrency(row.outstanding)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'daysOverdue',
      sortable: true,
      cell: (row: any) => {
        let text = row.daysOverdue > 0 ? `${row.daysOverdue} Days Overdue` : `Due in ${Math.abs(row.daysOverdue)} Days`;
        if (row.daysOverdue <= 0) return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-blue-500/20">{text}</span>;
        if (row.daysOverdue > 30) return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-900/50 dark:text-red-200 dark:ring-red-500/20">{text}</span>;
        if (row.daysOverdue > 15) return <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-800 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-900/50 dark:text-orange-200 dark:ring-orange-500/20">{text}</span>;
        return <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/50 dark:text-yellow-200 dark:ring-yellow-500/20">{text}</span>;
      },
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: any) => (
        <button
          onClick={() => handleSettle(row.id, row.type)}
          disabled={settlingId === row.id}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-colors"
          title={row.type === 'RECEIVABLE' ? 'Mark as Received' : 'Mark as Paid'}
        >
          {settlingId === row.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          <span>{row.type === 'RECEIVABLE' ? 'Receive' : 'Pay'}</span>
        </button>
      ),
    }
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-4 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {items.length} Overdue Accounts
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative">
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
