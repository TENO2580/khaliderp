'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { Factory, Flame, Layers, Plus, X, LayoutGrid, Table, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useViewMode } from '@/hooks/useViewMode';
import MobileFilterBar from './MobileFilterBar';
import MobilePagination from './MobilePagination';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

export default function MobileProductionPage() {
  const { viewMode, toggleViewMode } = useViewMode();
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
            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(p.id)}
            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
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

      <MobileFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search production logs..."
      />

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <DataTable 
            columns={columns} 
            data={productions} 
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
              <div className="flex justify-end items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => handleEditClick(p)}
                  className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}

          <MobilePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
          />
        </div>
      )}
      
      {/* Floating Action Button for Log Production */}
      <button 
        onClick={() => {
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
        className="fixed bottom-[88px] right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Full Screen Production Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto pt-4 pb-20 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Production Run' : 'Log Daily Production Run'}
            </h2>
            <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Select Batch *</label>
              <select
                required
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
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
                className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="DAY">Day Shift</option>
                <option value="NIGHT">Night Shift</option>
                <option value="MORNING">Morning Shift</option>
                <option value="EVENING">Evening Shift</option>
              </select>
            </div>

            {/* Raw Materials Consumed */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <Flame className="h-4 w-4" /> Raw Materials Consumed
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-600 dark:text-gray-400">Wax Used (KG)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.waxUsed}
                    onChange={(e) => setFormData({ ...formData, waxUsed: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-600 dark:text-gray-400">Fragrance (LTR)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.fragranceUsed}
                    onChange={(e) => setFormData({ ...formData, fragranceUsed: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-600 dark:text-gray-400">Color Dye (KG)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.colorUsed}
                    onChange={(e) => setFormData({ ...formData, colorUsed: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-600 dark:text-gray-400">Containers (PCS)</label>
                  <input
                    type="number"
                    value={formData.containerUsed}
                    onChange={(e) => setFormData({ ...formData, containerUsed: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-800"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-gray-600 dark:text-gray-400">Wicks (PCS)</label>
                  <input
                    type="number"
                    value={formData.wickUsed}
                    onChange={(e) => setFormData({ ...formData, wickUsed: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Output Qty */}
            <div>
              <label className="block text-xs font-bold text-gray-900 dark:text-white">Output Qty (KG) *</label>
              <input
                type="number"
                required
                value={formData.quantityProduced}
                onChange={(e) => setFormData({ ...formData, quantityProduced: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                className="mt-1 w-full rounded-xl border border-blue-500 p-3 text-sm dark:bg-gray-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. BINOD, FATHER, BALANCE 25 NOT USED"
                className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-800 dark:bg-gray-900"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 p-3.5 text-sm font-semibold text-white shadow-lg active:bg-blue-700"
              >
                {isEdit ? 'Save Changes' : 'Confirm Production Run'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
