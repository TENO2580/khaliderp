'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

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

  const buildPrintHtml = () => {
    // Build item rows with inline styles
    const cellStyle = 'padding: 6px; border-right: 1px solid black; border-bottom: 1px solid black;';
    const cellStyleLast = 'padding: 6px; border-bottom: 1px solid black;';
    const centerStyle = 'text-align: center;';
    const boldStyle = 'font-weight: bold;';

    let itemRowsHtml = '';
    for (let idx = 0; idx < totalRows; idx++) {
      const item = items[idx];
      const isLastFiller = idx === totalRows - 1;

      if (item) {
        itemRowsHtml += `<tr>
          <td style="${cellStyle} ${centerStyle} font-weight: 500;">${idx + 1}</td>
          <td style="${cellStyle} text-transform: uppercase; font-weight: 500;">${item.description}</td>
          <td style="${cellStyle} ${centerStyle}">${formatInvoiceNumber(item.quantity)}</td>
          <td style="${cellStyle} ${centerStyle}">${formatInvoiceNumber(item.rate)}</td>
          <td style="${cellStyle} ${centerStyle}">${formatInvoiceNumber(item.amount)}</td>
          <td style="${cellStyleLast} ${centerStyle}">${item.remarks || ''}</td>
        </tr>`;
      } else if (isLastFiller && totalRows <= minRows) {
        itemRowsHtml += `<tr style="height: 32px;">
          <td style="${cellStyle} ${centerStyle}">${idx + 1}</td>
          <td style="${cellStyle}"></td>
          <td style="${cellStyle}"></td>
          <td style="${cellStyle} ${boldStyle} ${centerStyle}">Grand Total: -</td>
          <td style="${cellStyle} ${boldStyle} ${centerStyle}">\u20B9${formatInvoiceNumber(grandTotal)}/-</td>
          <td style="${cellStyleLast}"></td>
        </tr>`;
      } else {
        itemRowsHtml += `<tr style="height: 32px;">
          <td style="${cellStyle} ${centerStyle}">${idx + 1}</td>
          <td style="${cellStyle}"></td>
          <td style="${cellStyle}"></td>
          <td style="${cellStyle}"></td>
          <td style="${cellStyle}"></td>
          <td style="${cellStyleLast}"></td>
        </tr>`;
      }
    }

    // Grand total row for > 5 items
    let grandTotalRowHtml = '';
    if (totalRows > minRows) {
      grandTotalRowHtml = `<tr style="${boldStyle}">
        <td colspan="3" style="${cellStyle}"></td>
        <td style="${cellStyle} ${boldStyle} ${centerStyle}">Grand Total: -</td>
        <td style="${cellStyle} ${boldStyle} ${centerStyle}">\u20B9${formatInvoiceNumber(grandTotal)}/-</td>
        <td style="${cellStyleLast}"></td>
      </tr>`;
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${invoiceNo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: black; background: white; padding: 20px; font-size: 13px; line-height: 1.4; }
    table { border-collapse: collapse; width: 100%; }
    @page { size: A4 portrait; margin: 15mm; }
  </style>
</head>
<body>
  <div style="max-width: 720px; margin: 0 auto;">
    <!-- Company Header -->
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0;">${companyName}</h1>
      <p style="font-size: 14px; font-weight: bold; margin-top: 4px;">${companySubtitle}</p>
      <p style="font-size: 12px; margin-top: 2px;">${companyAddress} &nbsp; ${companyPhone}</p>
    </div>

    <!-- Document Title -->
    <div style="text-align: center; margin: 16px 0;">
      <h2 style="font-family: Georgia, serif; font-size: 16px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; display: inline-block;">${invoiceType}</h2>
    </div>

    <!-- Metadata Table -->
    <table style="border: 1px solid black; margin-bottom: 0;">
      <tr style="border-bottom: 1px solid black;">
        <td style="width: 25%; padding: 6px; font-weight: bold; border-right: 1px solid black;">Invoice No.</td>
        <td style="width: 25%; padding: 6px; border-right: 1px solid black;">${invoiceNo}</td>
        <td style="width: 25%; padding: 6px; font-weight: bold; border-right: 1px solid black;">Date</td>
        <td style="width: 25%; padding: 6px;">${invoiceDate}</td>
      </tr>
      <tr style="border-bottom: 1px solid black;">
        <td style="padding: 6px; font-weight: bold; border-right: 1px solid black;">Customer</td>
        <td style="padding: 6px; font-weight: 600; text-transform: uppercase; border-right: 1px solid black;">${customerName}</td>
        <td style="padding: 6px; font-weight: bold; border-right: 1px solid black;">Mobile</td>
        <td style="padding: 6px;">${mobile}</td>
      </tr>
      <tr>
        <td style="padding: 6px; font-weight: bold; border-right: 1px solid black;">Location</td>
        <td style="padding: 6px; border-right: 1px solid black;">${location}</td>
        <td style="padding: 6px; font-weight: bold; border-right: 1px solid black;">Address</td>
        <td style="padding: 6px;">${address}</td>
      </tr>
    </table>

    <!-- Line Items Table -->
    <table style="border-left: 1px solid black; border-right: 1px solid black;">
      <thead>
        <tr style="border-bottom: 1px solid black; font-weight: bold; text-align: center;">
          <th style="padding: 6px; border-right: 1px solid black; width: 40px;">Sl</th>
          <th style="padding: 6px; border-right: 1px solid black; text-align: left;">Description</th>
          <th style="padding: 6px; border-right: 1px solid black; width: 60px;">Qty</th>
          <th style="padding: 6px; border-right: 1px solid black; width: 90px;">Rate (\u20B9)</th>
          <th style="padding: 6px; border-right: 1px solid black; width: 100px;">Amount (\u20B9)</th>
          <th style="padding: 6px; width: 90px;">Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
        ${grandTotalRowHtml}
      </tbody>
    </table>

    <!-- Signatures -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 64px; padding-top: 32px; font-family: Georgia, serif; font-size: 13px;">
      <div style="text-align: center; font-weight: bold;">Customer Signature</div>
      <div style="text-align: center; font-weight: bold;">
        <div>For ${companyName}</div>
        <div style="margin-top: 32px; font-weight: normal;">Authorized Signature</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to print invoices.');
      return;
    }
    printWindow.document.write(buildPrintHtml());
    printWindow.document.close();

    // Wait for content to render, then trigger print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Close the window after printing (or cancelling)
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
    // Fallback: if onload already fired (some browsers)
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        // already printed or closed
      }
    }, 500);
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100/50">
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
    </div>
  );
}
