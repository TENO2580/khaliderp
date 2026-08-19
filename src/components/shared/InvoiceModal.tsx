'use client';

import React, { useRef, useState } from 'react';
import { Printer, Download, X, FileText, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  remarks?: string;
}

interface InvoiceData {
  invoiceNo: string;
  date: string;
  customerName: string;
  mobile?: string;
  location?: string;
  address?: string;
  items: InvoiceItem[];
  grandTotal: number;
  companyName?: string;
  companySubtitle?: string;
  companyAddress?: string;
  companyPhone?: string;
  invoiceType?: string;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: any;
  customData?: Partial<InvoiceData>;
}

export default function InvoiceModal({ isOpen, onClose, order, customData }: InvoiceModalProps) {
  const [invoiceType, setInvoiceType] = useState(customData?.invoiceType || 'PROFORMA INVOICE');
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Extract / Normalize Order Data
  const parseNotes = (notes: any) => {
    if (!notes) return {};
    if (typeof notes === 'object') return notes;
    try {
      return JSON.parse(notes);
    } catch {
      return {};
    }
  };

  const notes = parseNotes(order?.notes);
  
  // Format Date DD/MM/YYYY
  const formatDateDDMMYYYY = (dateStr?: string | Date) => {
    if (!dateStr) return new Date().toLocaleDateString('en-GB');
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Clean rounding helper to avoid 204.99999999999997 floating point display bugs
  const formatInvoiceNumber = (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === '') return '0';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    const rounded = Math.round((num + Number.EPSILON) * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, '');
  };

  const invoiceNo = customData?.invoiceNo || order?.orderNumber || (order?.id ? order.id.slice(-4).toUpperCase() : '110');
  const invoiceDate = customData?.date || formatDateDDMMYYYY(order?.orderDate || order?.createdAt);
  const customerName = customData?.customerName || order?.customer?.name || notes?.customerName || 'MUSSAFIR STORE';
  const mobile = customData?.mobile || order?.customer?.phone || notes?.mobile || 'Nil';
  const location = customData?.location || order?.customer?.city || notes?.location || 'Nil';
  const address = customData?.address || order?.customer?.address || notes?.address || 'Nil';

  // Extract items
  let items: InvoiceItem[] = [];
  if (customData?.items && customData.items.length > 0) {
    items = customData.items;
  } else if (order?.items && Array.isArray(order.items) && order.items.length > 0) {
    items = order.items.map((i: any) => {
      const q = Number(i.quantity) || 0;
      const r = Number(i.unitPrice) || 0;
      const a = Number(i.amount) || Math.round((q * r + Number.EPSILON) * 100) / 100;
      return {
        description: i.product?.name || i.rawMaterial?.name || notes?.type || 'CANDLE PACK',
        quantity: q,
        rate: r,
        amount: Math.round((a + Number.EPSILON) * 100) / 100,
        remarks: '',
      };
    });
  } else {
    // Default fallback from order / notes
    const qty = Number(notes?.quantity) || order?.quantity || 20;
    const rate = Number(notes?.sellingCost) || (order?.totalAmount ? Number(order.totalAmount) / qty : 56);
    const total = Number(order?.totalAmount) || Math.round((qty * rate + Number.EPSILON) * 100) / 100;
    const desc = notes?.type || order?.type || 'WHITE CANDLE';
    items = [
      {
        description: desc,
        quantity: qty,
        rate: rate,
        amount: Math.round((total + Number.EPSILON) * 100) / 100,
        remarks: '',
      }
    ];
  }

  const grandTotal = customData?.grandTotal !== undefined 
    ? Math.round((Number(customData.grandTotal) + Number.EPSILON) * 100) / 100
    : (order?.totalAmount ? Math.round((Number(order.totalAmount) + Number.EPSILON) * 100) / 100 : items.reduce((sum, item) => sum + item.amount, 0));

  const companyName = customData?.companyName || 'LAKSHMI CANDLES';
  const companySubtitle = customData?.companySubtitle || 'Manufacturers & Wholesale Suppliers';
  const companyAddress = customData?.companyAddress || 'Address:Areekode,Therattammal,673639';
  const companyPhone = customData?.companyPhone || 'Phone: 9995052330';

  // Ensure minimum 5 rows for standard invoice height
  const minRows = 5;
  const totalRows = Math.max(minRows, items.length);
  const rowsArray = Array.from({ length: totalRows });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      {/* Modal Container */}
      <div className="relative my-8 flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-gray-200">
        
        {/* Action Header - Hidden during print */}
        <div className="print:hidden flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Invoice Preview & Print</h2>
              <p className="text-xs text-gray-500">Official formatted invoice for {customerName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Invoice Type Selector */}
            <select
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm focus:outline-none focus:border-blue-500"
            >
              <option value="PROFORMA INVOICE">PROFORMA INVOICE</option>
              <option value="TAX INVOICE">TAX INVOICE</option>
              <option value="ESTIMATE / BILL">ESTIMATE / BILL</option>
              <option value="DELIVERY CHALLAN">DELIVERY CHALLAN</option>
            </select>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100/50 print:bg-white print:p-0 print:overflow-visible">
          <div
            ref={printRef}
            id="printable-invoice"
            className="mx-auto w-full max-w-[760px] bg-white p-8 sm:p-10 shadow-sm border border-gray-200 print:border-none print:shadow-none text-black font-sans leading-tight"
            style={{ minHeight: '900px' }}
          >
            {/* 1. Company Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wide uppercase text-black">
                {companyName}
              </h1>
              <p className="text-sm font-bold text-black mt-1">
                {companySubtitle}
              </p>
              <p className="text-xs text-black mt-0.5">
                {companyAddress} &nbsp; {companyPhone}
              </p>
            </div>

            {/* 2. Document Title */}
            <div className="text-center my-4">
              <h2 className="text-base sm:text-lg font-serif font-black tracking-wider uppercase inline-block border-b-2 border-transparent text-black">
                {invoiceType}
              </h2>
            </div>

            {/* 3. Metadata & Details Box */}
            <div className="border border-black mb-0">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="w-1/4 p-1.5 font-bold border-r border-black">Invoice No.</td>
                    <td className="w-1/4 p-1.5 border-r border-black">{invoiceNo}</td>
                    <td className="w-1/4 p-1.5 font-bold border-r border-black">Date</td>
                    <td className="w-1/4 p-1.5">{invoiceDate}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1.5 font-bold border-r border-black">Customer</td>
                    <td className="p-1.5 font-semibold uppercase border-r border-black">{customerName}</td>
                    <td className="p-1.5 font-bold border-r border-black">Mobile</td>
                    <td className="p-1.5">{mobile}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-bold border-r border-black">Location</td>
                    <td className="p-1.5 border-r border-black">{location}</td>
                    <td className="p-1.5 font-bold border-r border-black">Address</td>
                    <td className="p-1.5">{address}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Line Items Table */}
            <div className="border-x border-b border-black">
              <table className="w-full border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-black font-bold text-center">
                    <th className="p-1.5 border-r border-black w-10">Sl</th>
                    <th className="p-1.5 border-r border-black text-left">Description</th>
                    <th className="p-1.5 border-r border-black w-16">Qty</th>
                    <th className="p-1.5 border-r border-black w-24">Rate (₹)</th>
                    <th className="p-1.5 border-r border-black w-28">Amount (₹)</th>
                    <th className="p-1.5 w-24">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsArray.map((_, idx) => {
                    const item = items[idx];
                    const isTotalRow = idx === totalRows - 1 && totalRows === minRows;

                    if (item) {
                      return (
                        <tr key={idx} className="border-b border-black">
                          <td className="p-1.5 border-r border-black text-center font-medium">{idx + 1}</td>
                          <td className="p-1.5 border-r border-black uppercase font-medium">{item.description}</td>
                          <td className="p-1.5 border-r border-black text-center">{formatInvoiceNumber(item.quantity)}</td>
                          <td className="p-1.5 border-r border-black text-center">{formatInvoiceNumber(item.rate)}</td>
                          <td className="p-1.5 border-r border-black text-center">{formatInvoiceNumber(item.amount)}</td>
                          <td className="p-1.5 text-center">{item.remarks || ''}</td>
                        </tr>
                      );
                    }

                    // Empty filler rows
                    const rowNum = idx + 1;
                    const isLastFiller = idx === totalRows - 1;

                    return (
                      <tr key={idx} className="border-b border-black h-8">
                        <td className="p-1.5 border-r border-black text-center">{rowNum}</td>
                        <td className="p-1.5 border-r border-black"></td>
                        <td className="p-1.5 border-r border-black"></td>
                        {isLastFiller ? (
                          <>
                            <td className="p-1.5 border-r border-black font-bold text-center">Grand Total: -</td>
                            <td className="p-1.5 border-r border-black font-bold text-center">₹{formatInvoiceNumber(grandTotal)}/-</td>
                            <td className="p-1.5"></td>
                          </>
                        ) : (
                          <>
                            <td className="p-1.5 border-r border-black"></td>
                            <td className="p-1.5 border-r border-black"></td>
                            <td className="p-1.5"></td>
                          </>
                        )}
                      </tr>
                    );
                  })}

                  {/* If items exceeded 5 rows, show explicit total row */}
                  {totalRows > minRows && (
                    <tr className="border-b border-black font-bold">
                      <td colSpan={3} className="p-1.5 border-r border-black"></td>
                      <td className="p-1.5 border-r border-black text-center">Grand Total: -</td>
                      <td className="p-1.5 border-r border-black text-center">₹{formatInvoiceNumber(grandTotal)}/-</td>
                      <td className="p-1.5"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 5. Signatures Footer */}
            <div className="flex justify-between items-end mt-16 pt-8 text-xs sm:text-sm font-serif">
              <div className="text-center font-bold">
                Customer Signature
              </div>
              <div className="text-center font-bold">
                <div>For {companyName}</div>
                <div className="mt-8 font-normal">Authorized Signature</div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Global Print CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}
