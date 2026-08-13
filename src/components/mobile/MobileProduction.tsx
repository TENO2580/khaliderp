'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { Factory, Flame, Layers, Plus, X, LayoutGrid, Table } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useViewMode } from '@/hooks/useViewMode';
import MobileFilterBar from './MobileFilterBar';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

export default function MobileProductionPage() {
  const { viewMode, toggleViewMode } = useViewMode();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

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

  const { data: resData, mutate: mutateProductions, isLoading } = useSWR(
    `/production?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    fetcher
  );
  const { data: batchesRes } = useSWR('/production/batches/list?limit=100', fetcher);
  const { data: userRes } = useSWR('/auth/me', fetcher);

  const productions = resData?.data || [];
  const totalPages = resData?.pagination?.totalPages || 1;
  const totalItems = resData?.pagination?.total || 0;
  
  const batches = batchesRes?.data || [];
  const operators = userRes ? [userRes] : [];

  useEffect(() => {
    if (userRes?.id && !formData.operatorId) {
      setFormData(prev => ({ ...prev, operatorId: userRes.id }));
    }
  }, [userRes, formData.operatorId]);

  const fetchData = () => {
    mutateProductions();
  };

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
      header: 'Date & Shift',
      cell: (p) => (
        <div>
          <p className="text-xs font-medium text-gray-900 dark:text-white">{formatDate(p.date)}</p>
          <p className="text-xs text-gray-500">{p.shift} Shift</p>
        </div>
      ),
    },
    {
      header: 'Output Qty',
      cell: (p) => <span className="font-bold text-gray-900 dark:text-white">{p.quantityProduced} KG</span>,
    },
    {
      header: 'Notes',
      cell: (p) => <span className="text-xs text-gray-500 max-w-[150px] truncate block" title={p.notes}>{p.notes || '-'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleViewMode}
          className="rounded-xl bg-white p-2 text-gray-600 shadow-sm border border-gray-200 active:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:active:bg-gray-800"
        >
          {viewMode === 'card' ? <Table className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
        </button>
      </div>

      {viewMode === 'card' && (
        <MobileFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search production logs..."
        />
      )}

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <DataTable columns={columns} data={productions} />
        </div>
      ) : (
        <div className="space-y-4">
          {productions.length === 0 && !isLoading && (
            <div className="text-center py-10 text-gray-500">No production logs found.</div>
          )}
          {productions.map((p: any) => (
            <div key={p.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{p.productionNumber}</div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white mt-1">{formatDate(p.date)} - {p.shift} Shift</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white">{p.quantityProduced} KG</div>
                  <div className="text-[10px] text-gray-400 mt-1 uppercase">Output Qty</div>
                </div>
              </div>
              {p.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                  {p.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Floating Action Button for Log Production */}
      <button 
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-[88px] right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Log Production Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto pt-4 pb-20 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Log Daily Production Run
            </h2>
            <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="space-y-6 flex-1">
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
                    {batches.map((b: any) => (
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
                      onChange={(e) => setFormData({ ...formData, waxUsed: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-950 dark:border-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400">Fragrance (LTR)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.fragranceUsed}
                      onChange={(e) => setFormData({ ...formData, fragranceUsed: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-950 dark:border-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400">Color Dye (KG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.colorUsed}
                      onChange={(e) => setFormData({ ...formData, colorUsed: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-950 dark:border-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400">Containers (PCS)</label>
                    <input
                      type="number"
                      value={formData.containerUsed}
                      onChange={(e) => setFormData({ ...formData, containerUsed: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-950 dark:border-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400">Wicks (PCS)</label>
                    <input
                      type="number"
                      value={formData.wickUsed}
                      onChange={(e) => setFormData({ ...formData, wickUsed: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
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
                    onChange={(e) => setFormData({ ...formData, labourCost: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400">Gas (₹)</label>
                  <input
                    type="number"
                    value={formData.gasCost}
                    onChange={(e) => setFormData({ ...formData, gasCost: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400">Electricity (₹)</label>
                  <input
                    type="number"
                    value={formData.electricityCost}
                    onChange={(e) => setFormData({ ...formData, electricityCost: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-white">Output Qty (KG)</label>
                  <input
                    type="number"
                    required
                    value={formData.quantityProduced}
                    onChange={(e) => setFormData({ ...formData, quantityProduced: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
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
