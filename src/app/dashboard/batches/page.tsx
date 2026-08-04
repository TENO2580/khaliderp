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
  const [totalItems, setTotalItems] = useState(0);

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

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        api.get(`/production/batches/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`),
        api.get('/inventory?limit=100'),
      ]);
      setBatches(bRes.data.data.data);
      setTotalPages(bRes.data.data.pagination.totalPages);
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
