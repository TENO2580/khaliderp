'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Layers, Plus } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [sellingPrice, setSellingPrice] = useState(350);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        api.get(`/production/batches/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
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
  }, [page, search, limit]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/production/batches', {
        productId: productId || undefined,
        productionDate: new Date().toISOString(),
        sellingPrice,
      });
      toast.success('New batch code generated!');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating batch');
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
      header: 'Sold',
      cell: (b) => <span className="text-xs text-emerald-600 font-medium">{b.soldQty} KG</span>,
    },
    {
      header: 'Remaining',
      cell: (b) => <span className="text-xs text-amber-600 font-semibold">{b.remainingQty} KG</span>,
    },
    {
      header: 'Prod Cost',
      cell: (b) => <span className="text-xs text-gray-600">{formatCurrency(b.productionCost)}</span>,
    },
    {
      header: 'Status',
      cell: (b) => <StatusBadge status={b.status} />,
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
      />

      {/* Create Batch Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Generate Production Batch Code</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
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
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Target Selling Price / Unit (₹)</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
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
    </div>
  );
}
