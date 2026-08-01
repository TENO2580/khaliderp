'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { FileText, Printer, X, Download, Flame, Edit3, Check } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

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
  }, [search, limit]);

  const handlePrintTrigger = () => {
    window.print();
  };

  const columns: Column<any>[] = [
    {
      header: 'INVOICE #',
      accessorKey: 'invoiceNumber',
      cell: (i) => (
        <button 
          onClick={() => {
            setSelectedInvoice(i);
            setIsEditMode(false);
          }}
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
      cell: (i) => <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(i.order?.subtotal || i.totalAmount - i.gstAmount)}</span>,
    },
    {
      header: 'CGST',
      accessorKey: 'cgst',
      cell: (i) => <span className="text-xs text-gray-500">{formatCurrency(i.order?.cgst || i.gstAmount / 2)}</span>,
    },
    {
      header: 'SGST',
      accessorKey: 'sgst',
      cell: (i) => <span className="text-xs text-gray-500">{formatCurrency(i.order?.sgst || i.gstAmount / 2)}</span>,
    },
    {
      header: 'IGST',
      accessorKey: 'igst',
      cell: (i) => <span className="text-xs text-gray-500">{formatCurrency(i.order?.igst || 0)}</span>,
    },
    {
      header: 'TOTAL',
      accessorKey: 'totalAmount',
      cell: (i) => <span className="font-bold text-emerald-600">{formatCurrency(i.totalAmount)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GST Tax Invoices</h1>
          <p className="text-sm text-gray-500">Official GST Tax Invoices for Lakshmi Candles</p>
        </div>
      </div>

      <DataTable totalItems={totalItems} limit={limit} onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={invoices}
        searchPlaceholder="Search invoice # or customer..."
        onSearch={(q) => setSearch(q)}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        isLoading={isLoading}
      />

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl text-gray-900 printable-area">
            {/* Modal Controls (Hidden during print) */}
            <div className="no-print flex items-center justify-between border-b pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-gray-900">Tax Invoice Preview</span>
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                  {selectedInvoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors",
                    isEditMode ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {isEditMode ? <Check className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />} 
                  {isEditMode ? 'Done Editing' : 'Edit Before Export'}
                </button>
                <button
                  onClick={handlePrintTrigger}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition-colors"
                >
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Official GST Tax Invoice Printable Document */}
            <div 
              className={cn(
                "border border-gray-300 p-6 rounded-xl space-y-6 text-sm font-sans bg-white",
                isEditMode && "ring-2 ring-blue-400 outline-none"
              )}
              contentEditable={isEditMode}
              suppressContentEditableWarning
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-300 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                      <Flame className="h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-black text-blue-900 tracking-tight">LAKSHMI CANDLES</h2>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 font-medium">Candle Manufacturing & Wholesale Distribution</p>
                  <p className="text-xs text-gray-500">124 Industrial Estate, Guindy, Chennai, Tamil Nadu - 600032</p>
                  <p className="text-xs text-gray-500">Phone: +91 98765 43210 | Email: billing@lakshmicandles.com</p>
                  <p className="text-xs font-bold text-blue-800 mt-1">GSTIN: 33AABCT0000A1ZA | State Code: 33 (Tamil Nadu)</p>
                </div>

                <div className="text-right">
                  <span className="inline-block border-2 border-blue-900 bg-blue-50 text-blue-900 font-bold text-xs uppercase px-3 py-1 rounded-md tracking-wider">
                    TAX INVOICE
                  </span>
                  <div className="mt-3 text-xs space-y-0.5">
                    <p><span className="font-bold text-gray-700">Invoice No:</span> <span className="font-mono font-bold text-blue-900">{selectedInvoice.invoiceNumber}</span></p>
                    <p><span className="font-bold text-gray-700">Invoice Date:</span> {formatDate(selectedInvoice.invoiceDate)}</p>
                    <p><span className="font-bold text-gray-700">Sales Order Ref:</span> {selectedInvoice.orderNumber}</p>
                    <p><span className="font-bold text-gray-700">Due Date:</span> {formatDate(selectedInvoice.dueDate)}</p>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">BUYER / BILL TO:</h4>
                  <p className="font-bold text-gray-900 text-base">{selectedInvoice.customerName}</p>
                  {selectedInvoice.ownerName && <p className="text-xs text-gray-600">Attn: {selectedInvoice.ownerName}</p>}
                  <p className="text-xs text-gray-600 mt-1">{selectedInvoice.customerAddress}</p>
                  <p className="text-xs text-gray-600">Phone: {selectedInvoice.customerPhone}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">TAX DETAILS:</h4>
                  <p className="text-xs font-bold text-gray-900">GSTIN: {selectedInvoice.customerGst || 'Unregistered / Retail'}</p>
                  <p className="text-xs text-gray-600">Place of Supply: Tamil Nadu (State Code 33)</p>
                  <p className="text-xs text-gray-600">Reverse Charge: No</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs border border-gray-300">
                <thead className="bg-slate-100 uppercase font-bold text-gray-700 border-b border-gray-300">
                  <tr>
                    <th className="p-2 border-r border-gray-300 text-center">#</th>
                    <th className="p-2 border-r border-gray-300">Item Description</th>
                    <th className="p-2 border-r border-gray-300 text-center">HSN</th>
                    <th className="p-2 border-r border-gray-300 text-right">Qty</th>
                    <th className="p-2 border-r border-gray-300 text-right">Rate (₹)</th>
                    <th className="p-2 border-r border-gray-300 text-right">Taxable (₹)</th>
                    <th className="p-2 border-r border-gray-300 text-right">CGST (9%)</th>
                    <th className="p-2 border-r border-gray-300 text-right">SGST (9%)</th>
                    <th className="p-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedInvoice.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2 border-r border-gray-300 text-center font-bold">{idx + 1}</td>
                      <td className="p-2 border-r border-gray-300 font-semibold">{item.name}</td>
                      <td className="p-2 border-r border-gray-300 text-center font-mono">{item.hsn}</td>
                      <td className="p-2 border-r border-gray-300 text-right font-bold">{item.qty}</td>
                      <td className="p-2 border-r border-gray-300 text-right">{item.price}</td>
                      <td className="p-2 border-r border-gray-300 text-right font-medium">{formatCurrency(item.taxable)}</td>
                      <td className="p-2 border-r border-gray-300 text-right text-slate-600">{formatCurrency(item.cgst)}</td>
                      <td className="p-2 border-r border-gray-300 text-right text-slate-600">{formatCurrency(item.sgst)}</td>
                      <td className="p-2 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex justify-between items-start pt-2">
                <div className="max-w-md space-y-2">
                  <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100 text-xs">
                    <p className="font-bold text-blue-900 uppercase tracking-wider">BANK PAYMENT DETAILS:</p>
                    <p className="mt-1"><span className="font-semibold">Bank Name:</span> HDFC Bank Ltd</p>
                    <p><span className="font-semibold">Account Name:</span> LAKSHMI CANDLES</p>
                    <p><span className="font-semibold">Account No:</span> 50200012345678</p>
                    <p><span className="font-semibold">IFSC Code:</span> HDFC0000123 (Guindy Branch)</p>
                  </div>
                  <p className="text-[11px] text-gray-500 italic">
                    Terms & Conditions: Goods once sold will not be taken back. Interest @ 18% p.a. will be charged if payment is delayed beyond due date. Subject to Chennai Jurisdiction.
                  </p>
                </div>

                <div className="w-64 space-y-1 text-xs border border-gray-300 rounded-lg p-3 bg-slate-50">
                  <div className="flex justify-between text-gray-600">
                    <span>Taxable Amount:</span>
                    <span className="font-semibold">{formatCurrency(selectedInvoice.taxableAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>CGST (9%):</span>
                    <span>{formatCurrency(selectedInvoice.cgstTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>SGST (9%):</span>
                    <span>{formatCurrency(selectedInvoice.sgstTotal)}</span>
                  </div>
                  {selectedInvoice.transportCharge > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Freight Charges:</span>
                      <span>{formatCurrency(selectedInvoice.transportCharge)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 flex justify-between text-sm font-bold text-gray-900">
                    <span>GRAND TOTAL:</span>
                    <span className="text-blue-900 text-base">{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Footer / Signatory */}
              <div className="flex justify-between items-end pt-8 border-t border-gray-300">
                <div className="text-xs text-gray-500">
                  <p>Customer Signature</p>
                  <div className="h-10 border-b border-dashed border-gray-400 w-40 mt-2" />
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-gray-900">For LAKSHMI CANDLES</p>
                  <div className="h-10 border-b border-dashed border-gray-400 w-48 mt-2 ml-auto" />
                  <p className="mt-1 text-gray-500 text-[11px]">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
