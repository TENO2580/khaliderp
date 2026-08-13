'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Edit3, Trash2, Plus, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

export default function MobileBatches() {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [sellingPrice, setSellingPrice] = useState(350);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [waxInitialQty, setWaxInitialQty] = useState<number | ''>('');
  const [waxRate, setWaxRate] = useState<number | ''>('');
  const [waxStock, setWaxStock] = useState<number | ''>('');
  const [producedQty, setProducedQty] = useState<number | ''>('');

  // Edit Modal State
  const [editBatch, setEditBatch] = useState<any>(null);

  const { data: resData, mutate: mutateBatches, isLoading } = useSWR(
    `/production/batches/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`,
    fetcher
  );
  const { data: productsRes } = useSWR('/inventory?limit=100', fetcher);

  const batches = resData?.data || [];
  const totalPages = resData?.pagination?.totalPages || 1;
  const totalItems = resData?.pagination?.total || 0;
  const products = productsRes?.data || [];

  const fetchData = () => {
    mutateBatches();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/production/batches', {
        productId: productId || undefined,
        purchaseDate,
        sellingPrice,
        waxInitialQty: Number(waxInitialQty) || 0,
        waxRate: Number(waxRate) || 0,
        waxStock: Number(waxStock) || 0,
        producedQty: Number(producedQty) || 0,
      });
      toast.success('New batch code generated!');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating batch');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/production/batches/${editBatch.id}`, {
        ...editBatch,
        waxStock: (Number(editBatch.waxInitialQty) || 0) - (Number(editBatch.producedQty) || 0),
        productionCost: (Number(editBatch.waxInitialQty) || 0) * (Number(editBatch.waxRate) || 0),
        remainingQty: (Number(editBatch.producedQty) || 0) - (Number(editBatch.soldQty) || 0),
      });
      toast.success('Batch updated successfully!');
      setEditBatch(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating batch');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this batch? This action cannot be undone.')) return;
    try {
      await api.delete(`/production/batches/${id}`);
      toast.success('Batch deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cannot delete batch (might be used in sales)');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title section removed, handled by MobileTopBar */}

      {/* Mobile Card List instead of DataTable */}
      <div className="space-y-4">
        {batches.length === 0 && !isLoading && (
          <div className="text-center py-10 text-gray-500">No batches found.</div>
        )}
        {batches.map((b: any) => {
          const pct = b.producedQty > 0 ? ((b.soldQty / b.producedQty) * 100).toFixed(0) : 0;
          return (
            <div key={b.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800" onClick={() => setEditBatch({ ...b, purchaseDate: new Date(b.purchaseDate).toISOString().split('T')[0] })}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{b.batchNumber}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">{b.product?.name || 'General Batch'}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm">
                <div>
                  <div className="text-xs text-gray-500">Produced</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{b.producedQty} KG</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Remaining</div>
                  <div className="font-semibold text-orange-600">{Number(b.remainingQty).toFixed(2)} KG</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                  <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 font-medium">{pct}% Sold</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Floating Action Button for Create Batch */}
      <button 
        onClick={() => {
          setEditBatch(null);
          setIsCreateOpen(true);
        }}
        className="fixed bottom-[88px] right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Create Batch Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto pt-4 pb-20 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editBatch ? 'Edit Batch' : 'New Batch'}
            </h2>
            <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="space-y-6 flex-1">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Target Product</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="">-- General / Multi-Product --</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.product?.id || p.id}>
                        {p.product?.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Date of Purchase</label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Initial Qty (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={waxInitialQty}
                    onChange={(e) => setWaxInitialQty(e.target.value === '' ? '' : (e.target.value === '' ? '' : Number(e.target.value)) as any)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={waxRate}
                    onChange={(e) => setWaxRate(e.target.value === '' ? '' : (e.target.value === '' ? '' : Number(e.target.value)) as any)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Stock (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={waxStock}
                    onChange={(e) => setWaxStock(e.target.value === '' ? '' : (e.target.value === '' ? '' : Number(e.target.value)) as any)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Candles Produced (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={producedQty}
                    onChange={(e) => setProducedQty(e.target.value === '' ? '' : (e.target.value === '' ? '' : Number(e.target.value)) as any)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Target Selling Price / Unit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice((e.target.value === '' ? '' : Number(e.target.value)) as any)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {editBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit Batch Details</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Date of Purchase</label>
                  <input
                    type="date"
                    required
                    value={editBatch.purchaseDate}
                    onChange={(e) => setEditBatch({ ...editBatch, purchaseDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Initial Qty (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBatch.waxInitialQty}
                    onChange={(e) => setEditBatch({ ...editBatch, waxInitialQty: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBatch.waxRate}
                    onChange={(e) => setEditBatch({ ...editBatch, waxRate: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Stock (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBatch.waxStock}
                    onChange={(e) => setEditBatch({ ...editBatch, waxStock: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Candle Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBatch.sellingPrice}
                    onChange={(e) => setEditBatch({ ...editBatch, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Candles Produced (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBatch.producedQty}
                    onChange={(e) => setEditBatch({ ...editBatch, producedQty: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Candles Sold (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBatch.soldQty}
                    onChange={(e) => setEditBatch({ ...editBatch, soldQty: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    required
                    value={editBatch.status}
                    onChange={(e) => setEditBatch({ ...editBatch, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="IN_PRODUCTION">In Production</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditBatch(null)}
                  className="rounded-xl px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
