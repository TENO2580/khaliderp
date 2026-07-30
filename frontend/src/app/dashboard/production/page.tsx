'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { Factory, Flame, Layers, Plus } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ProductionPage() {
  const [productions, setProductions] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString(),
    batchId: '',
    operatorId: '',
    shift: 'DAY',
    waxUsed: 100,
    fragranceUsed: 2,
    colorUsed: 0.5,
    containerUsed: 500,
    wickUsed: 500,
    labourCost: 1500,
    gasCost: 400,
    electricityCost: 200,
    otherCosts: 100,
    quantityProduced: 100,
    sellingPrice: 350,
    notes: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pRes, bRes, uRes] = await Promise.all([
        api.get(`/production?page=${page}&limit=10&search=${encodeURIComponent(search)}`),
        api.get('/production/batches/list?limit=100'),
        api.get('/auth/me'),
      ]);
      setProductions(pRes.data.data.data);
      setTotalPages(pRes.data.data.pagination.totalPages);
      setBatches(bRes.data.data.data);
      if (uRes.data.data) {
        setOperators([uRes.data.data]);
        setFormData((prev) => ({ ...prev, operatorId: uRes.data.data.id }));
      }
    } catch {
      toast.error('Failed to load production logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchId) {
      toast.error('Please select a production batch');
      return;
    }
    try {
      await api.post('/production', formData);
      toast.success('Production logged! Raw materials deducted & finished stock updated.');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error logging production');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Prod #',
      accessorKey: 'productionNumber',
      cell: (p) => <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{p.productionNumber}</span>,
    },
    {
      header: 'Batch #',
      cell: (p) => <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-300">{p.batch?.batchNumber}</span>,
    },
    {
      header: 'Date & Shift',
      cell: (p) => (
        <div>
          <p className="text-xs font-medium text-gray-900 dark:text-white">{formatDate(p.date)}</p>
          <p className="text-xs text-gray-500">{p.shift} Shift</p>
        </div>
      ),
    },
    {
      header: 'Wax Used',
      cell: (p) => <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{p.waxUsed} KG</span>,
    },
    {
      header: 'Output Qty',
      cell: (p) => <span className="font-bold text-gray-900 dark:text-white">{p.quantityProduced} KG</span>,
    },
    {
      header: 'Cost / KG',
      cell: (p) => <span className="text-xs font-medium text-gray-600">{formatCurrency(p.costPerKg)}</span>,
    },
    {
      header: 'Total Cost',
      cell: (p) => <span className="text-xs text-rose-600 font-medium">{formatCurrency(p.totalCost)}</span>,
    },
    {
      header: 'Margin %',
      cell: (p) => (
        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
          {formatPercent(p.margin)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Production Module</h1>
          <p className="text-sm text-gray-500">Log daily candle production runs, auto-deduct materials & track cost/KG</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={productions}
        searchPlaceholder="Search production # or batch #..."
        onSearch={(q) => setSearch(q)}
        onAddClick={() => setIsCreateOpen(true)}
        addButtonLabel="Log Production Run"
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        isLoading={isLoading}
      />

      {/* Log Production Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Log Daily Production Run</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Select Batch *</label>
                  <select
                    required
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="">-- Select Production Batch --</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchNumber} ({b.product?.name || 'General Batch'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="DAY">Day Shift</option>
                    <option value="NIGHT">Night Shift</option>
                    <option value="MORNING">Morning Shift</option>
                    <option value="EVENING">Evening Shift</option>
                  </select>
                </div>
              </div>

              {/* Raw Materials Consumed */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-1.5">
                  <Flame className="h-4 w-4" /> Raw Materials Consumed (Auto-Deducted)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400">Wax Used (KG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.waxUsed}
                      onChange={(e) => setFormData({ ...formData, waxUsed: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-950 dark:border-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400">Fragrance (LTR)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.fragranceUsed}
                      onChange={(e) => setFormData({ ...formData, fragranceUsed: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-950 dark:border-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400">Color Dye (KG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.colorUsed}
                      onChange={(e) => setFormData({ ...formData, colorUsed: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-950 dark:border-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400">Containers (PCS)</label>
                    <input
                      type="number"
                      value={formData.containerUsed}
                      onChange={(e) => setFormData({ ...formData, containerUsed: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-950 dark:border-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400">Wicks (PCS)</label>
                    <input
                      type="number"
                      value={formData.wickUsed}
                      onChange={(e) => setFormData({ ...formData, wickUsed: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-950 dark:border-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Utility & Labour Costs */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400">Labour (₹)</label>
                  <input
                    type="number"
                    value={formData.labourCost}
                    onChange={(e) => setFormData({ ...formData, labourCost: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400">Gas (₹)</label>
                  <input
                    type="number"
                    value={formData.gasCost}
                    onChange={(e) => setFormData({ ...formData, gasCost: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400">Electricity (₹)</label>
                  <input
                    type="number"
                    value={formData.electricityCost}
                    onChange={(e) => setFormData({ ...formData, electricityCost: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-white">Output Qty (KG)</label>
                  <input
                    type="number"
                    required
                    value={formData.quantityProduced}
                    onChange={(e) => setFormData({ ...formData, quantityProduced: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-blue-500 p-2 text-sm dark:bg-gray-950 font-bold"
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
                  Confirm Production Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
