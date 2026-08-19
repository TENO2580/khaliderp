'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import * as XLSX from 'xlsx';
import {
  History,
  X,
  FileSpreadsheet,
  Download,
  Calendar,
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Search,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface ImportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportHistoryModal({ isOpen, onClose }: ImportHistoryModalProps) {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImport, setSelectedImport] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/sales/import/history?limit=50');
      setHistoryList(res.data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load import history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const res = await api.get(`/sales/import/history/${id}`);
      setSelectedImport(res.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load import details');
    }
  };

  const downloadHistoryErrorReport = (historyItem: any) => {
    const errors = historyItem.errors || [];
    if (errors.length === 0) {
      toast.info('No errors recorded for this import.');
      return;
    }

    const exportData = errors.map((e: any) => ({
      'Row Number': e.row,
      'Customer': e.customer || '',
      'Errors': (e.errors || []).map((err: any) => `${err.field}: ${err.message}`).join(' | '),
      'Suggested Fix': e.suggestedFix || '',
      'Raw Data': JSON.stringify(e.data || {}),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, `${historyItem.importId}_errors.xlsx`);
  };

  if (!isOpen) return null;

  const filteredList = historyList.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.importId.toLowerCase().includes(q) ||
      item.fileName.toLowerCase().includes(q) ||
      (item.userName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Import History & Audit Log</h2>
              <p className="text-xs text-gray-500">Track and review past Excel/CSV batch uploads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedImport ? (
            /* Detail View */
            <div className="space-y-6">
              <button
                onClick={() => setSelectedImport(null)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                ← Back to all history records
              </button>

              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                <div>
                  <span className="text-xs text-gray-400">Import Reference</span>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white font-mono">
                    {selectedImport.importId}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>File: {selectedImport.fileName}</span>
                    <span>•</span>
                    <span>Date: {formatDate(selectedImport.createdAt)}</span>
                    <span>•</span>
                    <span>User: {selectedImport.userName || 'Admin'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-bold',
                      selectedImport.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : selectedImport.status === 'PARTIAL'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    )}
                  >
                    {selectedImport.status}
                  </span>

                  {(selectedImport.errors || []).length > 0 && (
                    <button
                      onClick={() => downloadHistoryErrorReport(selectedImport)}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Error Report</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Counts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="rounded-2xl border border-gray-200 p-3 dark:border-gray-800">
                  <span className="text-xs text-gray-500">Total Rows</span>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedImport.totalRows}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 dark:border-emerald-900/40">
                  <span className="text-xs text-emerald-600 font-semibold">Created</span>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{selectedImport.createdCount}</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-3 dark:border-blue-900/40">
                  <span className="text-xs text-blue-600 font-semibold">Updated</span>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{selectedImport.updatedCount}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50/40 p-3 dark:border-gray-800">
                  <span className="text-xs text-gray-500 font-semibold">Skipped</span>
                  <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{selectedImport.skippedCount}</p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-red-50/40 p-3 dark:border-red-900/40">
                  <span className="text-xs text-red-600 font-semibold">Failed</span>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">{selectedImport.failedCount}</p>
                </div>
              </div>

              {/* Sample Imported Rows */}
              {selectedImport.importedData && selectedImport.importedData.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Sample Imported Records
                  </h4>
                  <div className="rounded-2xl border border-gray-200 overflow-x-auto dark:border-gray-800">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-gray-50 text-gray-500 uppercase font-semibold dark:bg-gray-900">
                        <tr>
                          <th className="p-2.5">Order #</th>
                          <th className="p-2.5">Customer Name</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5 text-right">Qty</th>
                          <th className="p-2.5 text-right">Amount</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {selectedImport.importedData.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                            <td className="p-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">{row.orderNumber}</td>
                            <td className="p-2.5 font-bold text-gray-900 dark:text-white">{row.customerName}</td>
                            <td className="p-2.5">{row.orderDate}</td>
                            <td className="p-2.5">{row.type}</td>
                            <td className="p-2.5 text-right">{row.quantity} KG</td>
                            <td className="p-2.5 text-right font-mono font-bold">₹{Number(row.totalAmount).toLocaleString()}</td>
                            <td className="p-2.5">
                              <span className="rounded bg-gray-100 px-2 py-0.5 font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* History Table */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative max-w-xs flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by ID, file, user..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-1.5 pl-9 pr-3 text-xs text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <span className="text-xs text-gray-500">{filteredList.length} past imports</span>
              </div>

              <div className="rounded-2xl border border-gray-200 overflow-x-auto dark:border-gray-800">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-semibold dark:bg-gray-900 dark:text-gray-400">
                    <tr>
                      <th className="p-3">Import ID</th>
                      <th className="p-3">File Name</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">User</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-right text-emerald-600">Created</th>
                      <th className="p-3 text-right text-blue-600">Updated</th>
                      <th className="p-3 text-right text-red-600">Failed</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-gray-400">
                          {isLoading ? 'Loading import history...' : 'No import records found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-900/40">
                          <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {item.importId}
                          </td>
                          <td className="p-3 font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-gray-400" />
                            <span>{item.fileName}</span>
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">{formatDate(item.createdAt)}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">{item.userName || 'Admin'}</td>
                          <td className="p-3 text-right font-bold text-gray-900 dark:text-white">{item.totalRows}</td>
                          <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{item.createdCount}</td>
                          <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">{item.updatedCount}</td>
                          <td className="p-3 text-right font-bold text-red-600 dark:text-red-400">{item.failedCount}</td>
                          <td className="p-3">
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
                                item.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : item.status === 'PARTIAL'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              )}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleViewDetails(item.id)}
                              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50/80 px-6 py-3 dark:border-gray-800 dark:bg-gray-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
