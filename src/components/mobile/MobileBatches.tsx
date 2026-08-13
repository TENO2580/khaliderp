'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Edit3, Trash2, Plus, X, LayoutGrid, Table } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useViewMode } from '@/hooks/useViewMode';
import MobileFilterBar from './MobileFilterBar';
import MobilePagination from './MobilePagination';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

export default function MobileBatches() {
  const { viewMode, toggleViewMode } = useViewMode();
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

  const columns: Column<any>[] = [
    {
      header: 'Batch #',
      accessorKey: 'batchNumber',
      cell: (b) => <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{b.batchNumber}</span>,
    },
    {
      header: 'Product',
      cell: (b) => <span className="font-medium text-gray-900 dark:text-white">{b.product?.name || 'General Batch'}</span>,
    },
    {
      header: 'Date',
      cell: (b) => <span className="text-xs text-gray-500">{formatDate(b.purchaseDate)}</span>,
    },
    {
      header: 'Wax Initial Qty',
      editableKey: 'waxInitialQty',
      inlineEditable: true,
      inputType: 'number',
      cell: (b) => <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{Number(b.waxInitialQty).toFixed(2)} KG</span>,
    },
    {
      header: 'Wax Rate',
      editableKey: 'waxRate',
      inlineEditable: true,
      inputType: 'number',
      cell: (b) => <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(b.waxRate)}</span>,
    },
    {
      header: 'Candle Selling Price',
      editableKey: 'sellingPrice',
      inlineEditable: true,
      inputType: 'number',
      cell: (b) => <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(b.sellingPrice)}</span>,
    },
    {
      header: 'Produced',
      editableKey: 'producedQty',
      inlineEditable: true,
      inputType: 'number',
      cell: (b) => <span className="font-semibold text-gray-900 dark:text-white">{b.producedQty} KG</span>,
    },
    {
      header: 'SOLD',
      cell: (b) => <span className="text-xs text-emerald-600 font-medium">{Number(b.soldQty).toFixed(2)} KG</span>,
    },
    {
      header: 'REMAINING',
      cell: (b) => <span className="text-xs text-orange-600 font-medium">{Number(b.remainingQty).toFixed(2)} KG</span>,
    },
    {
      header: 'Wax Stock',
      cell: (b) => {
        const stock = (Number(b.waxInitialQty) || 0) - (Number(b.producedQty) || 0);
        return <span className="text-xs text-blue-600 font-medium">{stock.toFixed(2)} KG</span>;
      },
    },
    {
      header: 'Completion %',
      cell: (b) => {
        const pct = b.producedQty > 0 ? ((b.soldQty / b.producedQty) * 100).toFixed(0) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${pct}%` }} 
              />
            </div>
            <span className="text-xs text-gray-500 font-medium">{pct}%</span>
          </div>
        );
      }
    },
    {
      header: 'Prod Cost',
      editableKey: 'productionCost',
      inlineEditable: true,
      inputType: 'number',
      cell: (b) => <span className="text-xs text-gray-600">{formatCurrency(b.productionCost)}</span>,
    },
    {
      header: 'Status',
      editableKey: 'status',
      inlineEditable: true,
      cell: (b) => <StatusBadge status={b.status} />,
    },
    {
      header: 'Action',
      cell: (b) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditBatch({ ...b, purchaseDate: new Date(b.purchaseDate).toISOString().split('T')[0] })}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(b.id)}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleBatchSave = async (edits: { rowId: string; key: string; value: string }[]) => {
    try {
      const grouped: Record<string, Record<string, string>> = {};
      for (const edit of edits) {
        if (!grouped[edit.rowId]) grouped[edit.rowId] = {};
        grouped[edit.rowId][edit.key] = edit.value;
      }
      for (const [rowId, fields] of Object.entries(grouped)) {
        const batch = batches.find((b: any) => b.id === rowId);
        if (!batch) continue;
        const updateBody: any = { ...batch };
        for (const [key, value] of Object.entries(fields)) {
          if (['producedQty', 'productionCost', 'sellingPrice', 'waxInitialQty', 'waxRate', 'waxStock'].includes(key)) {
            updateBody[key] = Number(value) || 0;
          } else {
            updateBody[key] = value;
          }
        }
        
        // Auto-calculate dependencies
        updateBody.waxStock = (Number(updateBody.waxInitialQty) || 0) - (Number(updateBody.producedQty) || 0);
        updateBody.productionCost = (Number(updateBody.waxInitialQty) || 0) * (Number(updateBody.waxRate) || 0);
        updateBody.remainingQty = (Number(updateBody.producedQty) || 0) - (Number(updateBody.soldQty) || 0);

        await api.put(`/production/batches/${rowId}`, updateBody);
      }
      toast.success(`${Object.keys(grouped).length} batch(es) updated!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="min-w-0 pr-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">Batch Tracking</h1>
          <p className="text-sm text-gray-500 line-clamp-1">Track candle manufacturing batches</p>
        </div>
        <div className="flex justify-end shrink-0 mb-4 sm:mb-0">
          <button
            onClick={toggleViewMode}
            className="rounded-xl bg-white p-2 text-gray-600 shadow-sm border border-gray-200 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:active:bg-gray-800"
          >
            {viewMode === 'card' ? <Table className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <MobileFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search batches..."
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: 'In Progress', value: 'IN_PROGRESS' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Failed', value: 'FAILED' }
        ]}
      />

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <DataTable 
            columns={columns} 
            data={batches} 
            enableInlineEdit={true} 
            onBatchSave={handleBatchSave} 
            hideToolbar={true} 
            totalItems={totalItems}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            limit={limit}
            onLimitChange={setLimit}
          />
        </div>
      ) : (
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
          
          <MobilePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
          />
        </div>
      )}
      
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
