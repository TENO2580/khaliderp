'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Package, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit3 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  // Adjustment modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustment, setAdjustment] = useState(10);
  const [reason, setReason] = useState('Manual Stock Adjustment');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/inventory?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      setInventory(res.data.data.data);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, limit]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await api.post('/inventory/adjust', {
        type: 'inventory',
        itemId: selectedItem.id,
        adjustment,
        reason,
      });
      toast.success('Stock adjusted & movement logged!');
      setIsAdjustOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error adjusting stock');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'SKU',
      cell: (i) => <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{i.product?.sku}</span>,
    },
    {
      header: 'Product Name',
      cell: (i) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{i.product?.name}</p>
          <p className="text-xs text-gray-500">{i.product?.category || 'Scented Candles'}</p>
        </div>
      ),
    },
    {
      header: 'Current Stock',
      cell: (i) => {
        const isLow = i.currentStock <= i.reorderLevel;
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-white text-base">
              {formatNumber(i.currentStock)} {i.product?.unit || 'PCS'}
            </span>
            {isLow && (
              <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                <AlertTriangle className="h-3 w-3" /> Low Stock
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Reorder Level',
      cell: (i) => <span className="text-xs text-gray-500 font-medium">{i.reorderLevel} {i.product?.unit || 'PCS'}</span>,
    },
    {
      header: 'Unit Cost',
      cell: (i) => <span className="text-xs text-gray-600">{formatCurrency(i.unitCost || 0)}</span>,
    },
    {
      header: 'Stock Value',
      cell: (i) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(i.currentStock * (i.unitCost || 0))}</span>,
    },
    {
      header: 'Action',
      cell: (i) => (
        <button
          onClick={() => {
            setSelectedItem(i);
            setIsAdjustOpen(true);
          }}
          className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
        >
          <Edit3 className="h-3.5 w-3.5" /> Adjust
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finished Goods Inventory</h1>
          <p className="text-sm text-gray-500">Live stock levels, reorder alerts & inventory valuations</p>
        </div>
      </div>

      <DataTable
        limit={limit}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={inventory}
        searchPlaceholder="Search product or SKU..."
        onSearch={setSearch}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        monthFilter={monthFilter}
        onMonthChange={setMonthFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: 'Low Stock', value: 'LOW_STOCK' },
          { label: 'In Stock', value: 'IN_STOCK' },
        ]}
      />

      {/* Adjust Stock Modal */}
      {isAdjustOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Adjust Stock Quantity</h2>
            <p className="text-xs text-gray-500 mb-4">{selectedItem.product?.name} (Current: {selectedItem.currentStock})</p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Adjustment (+ for In, - for Out)</label>
                <input
                  type="number"
                  required
                  value={adjustment}
                  onChange={(e) => setAdjustment(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Reason for Adjustment</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
