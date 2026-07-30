'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, Printer, Download } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setIsLoading(false);
    // Mock invoices for demo
    setInvoices([
      {
        id: '1',
        invoiceNumber: 'INV-2026-0001',
        orderNumber: 'SO-2026-0001',
        customerName: 'Aroma House',
        invoiceDate: new Date().toISOString(),
        taxableAmount: 35000,
        gstAmount: 6300,
        totalAmount: 41300,
        status: 'ISSUED',
      },
      {
        id: '2',
        invoiceNumber: 'INV-2026-0002',
        orderNumber: 'SO-2026-0002',
        customerName: 'Candle World',
        invoiceDate: new Date().toISOString(),
        taxableAmount: 18000,
        gstAmount: 3240,
        totalAmount: 21240,
        status: 'PAID',
      },
    ]);
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handlePrint = (invNum: string) => {
    toast.success(`Printing Tax Invoice ${invNum}...`);
  };

  const columns: Column<any>[] = [
    {
      header: 'Invoice #',
      accessorKey: 'invoiceNumber',
      cell: (i) => <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{i.invoiceNumber}</span>,
    },
    {
      header: 'Sales Order',
      accessorKey: 'orderNumber',
      cell: (i) => <span className="font-mono text-xs font-medium text-gray-500">{i.orderNumber}</span>,
    },
    {
      header: 'Customer Name',
      cell: (i) => <span className="font-semibold text-gray-900 dark:text-white">{i.customerName}</span>,
    },
    {
      header: 'Invoice Date',
      cell: (i) => <span className="text-xs text-gray-500">{formatDate(i.invoiceDate)}</span>,
    },
    {
      header: 'GST Tax (18%)',
      cell: (i) => <span className="text-xs font-medium text-blue-600">{formatCurrency(i.gstAmount)}</span>,
    },
    {
      header: 'Total Amount',
      cell: (i) => <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(i.totalAmount)}</span>,
    },
    {
      header: 'Status',
      cell: (i) => <StatusBadge status={i.status} />,
    },
    {
      header: 'Action',
      cell: (i) => (
        <button
          onClick={() => handlePrint(i.invoiceNumber)}
          className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
        >
          <Printer className="h-3.5 w-3.5" /> Print Invoice
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GST Invoices</h1>
          <p className="text-sm text-gray-500">View and print official GST Tax Invoices & E-way bills</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        searchPlaceholder="Search invoice # or customer..."
        onSearch={(q) => setSearch(q)}
        isLoading={isLoading}
      />
    </div>
  );
}
