'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const totalItems = payments.length;

  const fetchData = async () => {
    setIsLoading(false);
    setPayments([]);
  };

  useEffect(() => {
    fetchData();
  }, [search, limit]);

  const columns: Column<any>[] = [
    {
      header: 'Payment Ref',
      accessorKey: 'paymentRef',
      cell: (p) => <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{p.paymentRef}</span>,
    },
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      cell: (p) => <span className="font-mono text-xs font-medium text-gray-500">{p.invoiceNumber}</span>,
    },
    {
      header: 'Customer',
      cell: (p) => <span className="font-semibold text-gray-900 dark:text-white">{p.customerName}</span>,
    },
    {
      header: 'Payment Mode',
      accessorKey: 'method',
      cell: (p) => <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">{p.method}</span>,
    },
    {
      header: 'Txn Ref / UTR',
      accessorKey: 'referenceNumber',
      cell: (p) => <span className="font-mono text-xs text-gray-600">{p.referenceNumber}</span>,
    },
    {
      header: 'Amount Paid',
      cell: (p) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount)}</span>,
    },
    {
      header: 'Status',
      cell: (p) => <StatusBadge status={p.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Payments</h1>
          <p className="text-sm text-gray-500">Record customer receipts, UPI, Bank Transfer & cash payments</p>
        </div>
      </div>

      <DataTable totalItems={totalItems} limit={limit} onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={payments}
        searchPlaceholder="Search payment ref or customer..."
        onSearch={(q) => setSearch(q)}
        isLoading={isLoading}
      />
    </div>
  );
}
