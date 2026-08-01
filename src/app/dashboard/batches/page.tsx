'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Edit3 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [sellingPrice, setSellingPrice] = useState(350);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [waxUsed, setWaxUsed] = useState<number | ''>('');
  const [costPerKg, setCostPerKg] = useState<number | ''>('');
  const [productionCost, setProductionCost] = useState<number | ''>('');
  const [producedQty, setProducedQty] = useState<number | ''>('');

  // Edit Modal State
  const [editBatch, setEditBatch] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        api.get(`/production/batches/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`),
        api.get('/inventory?limit=100'),
      ]);
      setBatches(bRes.data.data.data);
      setTotalPages(bRes.data.data.pagination.totalPages);
      setProducts(pRes.data.data.data);
    } catch {
      toast.error('Failed to load batch list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, limit, startDate, endDate, statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/production/batches', {
        productId: productId || undefined,
        productionDate,
        sellingPrice,
        waxUsed: Number(waxUsed) || 0,
        costPerKg: Number(costPerKg) || 0,
        productionCost: Number(productionCost) || 0,
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
      const profit = (editBatch.producedQty * editBatch.sellingPrice) - editBatch.productionCost;
      
      await api.put(`/production/batches/${editBatch.id}`, {
        ...editBatch,
        profit,
        remainingQty: editBatch.producedQty - editBatch.soldQty,
      });
      toast.success('Batch updated successfully!');
      setEditBatch(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating batch');
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
      cell: (b) => <span className="text-xs text-gray-500">{formatDate(b.productionDate)}</span>,
    },
    {
      header: 'Produced',
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
      cell: (b) => <span className="text-xs text-gray-600">{formatCurrency(b.productionCost)}</span>,
    },
    {
      header: 'Status',
      cell: (b) => <StatusBadge status={b.status} />,
    },
    {
      header: 'Action',
      cell: (b) => (
        <button
          onClick={() => setEditBatch({ ...b, productionDate: new Date(b.productionDate).toISOString().split('T')[0] })}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-800"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Batch Tracking</h1>
          <p className="text-sm text-gray-500">Track candle manufacturing batches from production to sale</p>
        </div>
      </div>

      <DataTable limit={limit} onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={batches}
        searchPlaceholder="Search batch number..."
        onSearch={(q) => setSearch(q)}
        onAddClick={() => setIsCreateOpen(true)}
        addButtonLabel="Generate New Batch"
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        isLoading={isLoading}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: 'In Production', value: 'IN_PRODUCTION' },
          { label: 'Completed', value: 'COMPLETED' },
        ]}
      />

      {/* Create Batch Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Generate Production Batch Code</h2>
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
                    {products.map((p) => (
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
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Initial Qty / Used (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={waxUsed}
                    onChange={(e) => setWaxUsed(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costPerKg}
                    onChange={(e) => setCostPerKg(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Total Production Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productionCost}
                    onChange={(e) => setProductionCost(e.target.value === '' ? '' : Number(e.target.value))}
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
                    onChange={(e) => setProducedQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Target Selling Price / Unit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
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
                    value={editBatch.productionDate}
                    onChange={(e) => setEditBatch({ ...editBatch, productionDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Initial Qty / Used (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBatch.waxUsed}
                    onChange={(e) => setEditBatch({ ...editBatch, waxUsed: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Wax Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBatch.costPerKg}
                    onChange={(e) => setEditBatch({ ...editBatch, costPerKg: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Total Production Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBatch.productionCost}
                    onChange={(e) => setEditBatch({ ...editBatch, productionCost: parseFloat(e.target.value) || 0 })}
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
