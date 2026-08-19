'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Printer } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import InvoiceModal from '@/components/shared/InvoiceModal';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/sales/invoices/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      setInvoices(res.data.data.data);
      setTotalPages(res.data.data.pagination.totalPages);
      setTotalItems(res.data.data.pagination.total);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, limit, page]);

  const columns: Column<any>[] = [
    {
      header: 'INVOICE #',
      accessorKey: 'invoiceNumber',
      cell: (i) => (
        <button 
          onClick={() => setSelectedInvoice(i)}
          className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline text-left"
        >
          {i.invoiceNumber}
        </button>
      ),
    },
    {
      header: 'CUSTOMER',
      accessorKey: 'customerName',
      cell: (i) => <span className="font-semibold text-gray-900 dark:text-white uppercase">{i.customerName}</span>,
    },
    {
      header: 'DATE',
      accessorKey: 'invoiceDate',
      cell: (i) => <span className="text-xs text-gray-500">{formatDate(i.invoiceDate)}</span>,
    },
    {
      header: 'TAXABLE AMT',
      accessorKey: 'subtotal',
      cell: (i) => <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(i.order?.subtotal || i.taxableAmount || i.totalAmount - (i.gstAmount || 0))}</span>,
    },
    {
      header: 'TOTAL AMOUNT',
      accessorKey: 'totalAmount',
      cell: (i) => <span className="font-bold text-emerald-600">{formatCurrency(i.totalAmount)}</span>,
    },
    {
      header: 'ACTIONS',
      cell: (i) => (
        <button
          onClick={() => setSelectedInvoice(i)}
          className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 transition-colors"
          title="Print Proforma Invoice / Bill"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>View / Print</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices & Bills</h1>
          <p className="text-sm text-gray-500">Official Proforma Invoices & Bills for Lakshmi Candles</p>
        </div>
      </div>

      <DataTable
        totalItems={totalItems}
        limit={limit}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={invoices}
        searchPlaceholder="Search invoice # or customer..."
        onSearch={(q) => setSearch(q)}
        totalPages={totalPages}
        page={page}
        onPageChange={(p) => setPage(p)}
        isLoading={isLoading}
      />

      {/* Official Proforma / Bill Modal Matching Template */}
      {selectedInvoice && (
        <InvoiceModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          customData={{
            invoiceNo: selectedInvoice.invoiceNumber || selectedInvoice.orderNumber,
            date: selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-GB') : '',
            customerName: selectedInvoice.customerName || selectedInvoice.customer?.name,
            mobile: selectedInvoice.customerPhone || selectedInvoice.customer?.phone || 'Nil',
            location: selectedInvoice.customer?.city || 'Nil',
            address: selectedInvoice.customerAddress || selectedInvoice.customer?.address || 'Nil',
            items: selectedInvoice.items && selectedInvoice.items.length > 0 ? selectedInvoice.items.map((item: any) => ({
              description: item.name || 'CANDLE PACK',
              quantity: Number(item.qty) || 0,
              rate: Number(item.price) || 0,
              amount: Number(item.total || item.taxable || (Number(item.qty) * Number(item.price))) || 0,
              remarks: '',
            })) : undefined,
            grandTotal: selectedInvoice.totalAmount,
            companyName: 'LAKSHMI CANDLES',
            companySubtitle: 'Manufacturers & Wholesale Suppliers',
            companyAddress: 'Address:Areekode,Therattammal,673639',
            companyPhone: 'Phone: 9995052330',
            invoiceType: 'PROFORMA INVOICE',
          }}
          order={selectedInvoice.order}
        />
      )}
    </div>
  );
}
