'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { Factory, Flame, Layers, Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

export default function DesktopProduction() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
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

  const handleEditClick = (p: any) => {
    setIsEdit(true);
    setEditId(p.id);
    setFormData({
      date: p.date ? new Date(p.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      batchId: p.batchId || '',
      operatorId: p.operatorId || (userRes?.id || ''),
      shift: p.shift || 'DAY',
      waxUsed: p.waxUsed !== undefined ? p.waxUsed : 100,
      fragranceUsed: p.fragranceUsed !== undefined ? p.fragranceUsed : 2,
      colorUsed: p.colorUsed !== undefined ? p.colorUsed : 0.5,
      containerUsed: p.containerUsed !== undefined ? p.containerUsed : 500,
      wickUsed: p.wickUsed !== undefined ? p.wickUsed : 500,
      labourCost: p.labourCost !== undefined ? p.labourCost : 1500,
      gasCost: p.gasCost !== undefined ? p.gasCost : 400,
      electricityCost: p.electricityCost !== undefined ? p.electricityCost : 200,
      otherCosts: p.otherCosts !== undefined ? p.otherCosts : 100,
      quantityProduced: p.quantityProduced !== undefined ? p.quantityProduced : 100,
      sellingPrice: p.sellingPrice !== undefined ? p.sellingPrice : 350,
      notes: p.notes || '',
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this production run? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/production/${id}`);
      toast.success('Production run deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete production run');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batchId) {
      toast.error('Please select a production batch');
      return;
    }
    try {
      if (isEdit) {
        await api.put(`/production/${editId}`, formData);
        toast.success('Production run updated successfully!');
      } else {
        await api.post('/production', formData);
        toast.success('Production logged! Raw materials deducted & finished stock updated.');
      }
      setIsCreateOpen(false);
      setIsEdit(false);
      setEditId('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving production run');
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
    {
      header: 'Actions',
      cell: (p) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditClick(p)}
            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
            title="Edit Production Run"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(p.id)}
            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
            title="Delete Production Run"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
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

      <DataTable totalItems={totalItems} limit={limit} onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={productions}
        searchPlaceholder="Search production # or batch #..."
        onSearch={(q) => setSearch(q)}
        onAddClick={() => {
          setIsEdit(false);
          setEditId('');
          setFormData({
            date: new Date().toISOString().split('T')[0],
            batchId: '',
            operatorId: userRes?.id || '',
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
          setIsCreateOpen(true);
        }}
        addButtonLabel="Log Production Run"
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        isLoading={isLoading}
      />

      {/* Create / Edit Production Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isEdit ? 'Edit Production Run' : 'Log Daily Production Run'}
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Select Batch *</label>
                  <select
                    required
                    value={formData.batchId}
                    onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="">-- Select Batch --</option>
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Notes</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. BINOD, FATHER, BALANCE 25 NOT USED"
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm dark:border-gray-800 dark:bg-gray-950"
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
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  {isEdit ? 'Save Changes' : 'Confirm Production Run'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
