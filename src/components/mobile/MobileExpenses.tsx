'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Check, Edit3, Trash2, Receipt, Plus, X, LayoutGrid, Table } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useViewMode } from '@/hooks/useViewMode';
import MobileFilterBar from './MobileFilterBar';
import MobilePagination from './MobilePagination';

const fetcher = (url: string) => api.get(url).then(res => res.data?.data ?? res.data);

export default function MobileExpenses() {
  const { viewMode, toggleViewMode } = useViewMode();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add Expense Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '' as any,
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: '',
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Edit Expense Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [isEditCustomCategory, setIsEditCustomCategory] = useState(false);
  const [editCustomCategoryName, setEditCustomCategoryName] = useState('');
  const [editData, setEditData] = useState({
    categoryId: '',
    amount: 0,
    date: '',
    description: '',
    status: '',
  });

  const { data: resData, mutate: mutateExpenses, isLoading } = useSWR(
    `/expenses?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`,
    fetcher
  );
  const { data: categoriesData, mutate: mutateCategories } = useSWR('/expenses/categories', fetcher);
  const { data: statsData } = useSWR('/expenses/stats', fetcher);

  const expenses = resData?.data || (Array.isArray(resData) ? resData : []);
  const totalPages = resData?.pagination?.totalPages || 1;
  const totalItems = resData?.pagination?.total || expenses.length;
  
  const categories: any[] = Array.isArray(categoriesData)
    ? categoriesData
    : Array.isArray(categoriesData?.data)
    ? categoriesData.data
    : [];
  const stats = statsData || null;

  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, formData.categoryId]);

  const fetchData = () => {
    mutateExpenses();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let catId = formData.categoryId || categories[0]?.id;

    if (isCustomCategory) {
      if (!customCategoryName.trim()) {
        toast.error('Please enter a category name');
        return;
      }
      try {
        const catRes = await api.post('/expenses/categories', { name: customCategoryName.trim() });
        catId = catRes.data.data.id;
        mutateCategories();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to create category');
        return;
      }
    }

    if (!catId) {
      toast.error('Please select or add an expense category');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      const descParts = [formData.description, formData.paymentMethod ? `Payment: ${formData.paymentMethod}` : ''].filter(Boolean).join(' | ');
      await api.post('/expenses', {
        categoryId: catId,
        amount: Number(formData.amount),
        date: formData.date || new Date().toISOString().split('T')[0],
        description: descParts || formData.description || 'Expense'
      });
      toast.success('Expense recorded successfully!');
      setIsCreateOpen(false);
      setIsCustomCategory(false);
      setCustomCategoryName('');
      setFormData({
        categoryId: catId || categories[0]?.id || '',
        amount: '' as any,
        date: new Date().toISOString().split('T')[0],
        description: '',
        paymentMethod: '',
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error recording expense');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/expenses/${id}/approve`);
      toast.success('Expense approved');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error approving expense');
    }
  };

  const openEdit = (expense: any) => {
    setEditId(expense.id);
    setIsEditCustomCategory(false);
    setEditCustomCategoryName('');
    setEditData({
      categoryId: expense.categoryId || expense.category?.id || categories[0]?.id || '',
      amount: expense.amount,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      description: expense.description || '',
      status: expense.status || 'PENDING',
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let catId = editData.categoryId;
    if (isEditCustomCategory) {
      if (!editCustomCategoryName.trim()) {
        toast.error('Please enter a category name');
        return;
      }
      try {
        const catRes = await api.post('/expenses/categories', { name: editCustomCategoryName.trim() });
        catId = catRes.data.data.id;
        mutateCategories();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to create category');
        return;
      }
    }
    try {
      await api.put(`/expenses/${editId}`, { ...editData, categoryId: catId });
      toast.success('Expense updated successfully!');
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error deleting expense');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Category',
      cell: (e) => (
        <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Receipt className="h-4 w-4 text-blue-600" />
          {e.category?.name || 'General'}
        </span>
      ),
    },
    {
      header: 'Description',
      accessorKey: 'description',
      editableKey: 'description',
      inlineEditable: true,
      cell: (e) => <span className="text-xs text-gray-600 dark:text-gray-400">{e.description || 'N/A'}</span>,
    },
    {
      header: 'Date',
      cell: (e) => <span className="text-xs text-gray-500">{formatDate(e.date)}</span>,
    },
    {
      header: 'Amount',
      editableKey: 'amount',
      inlineEditable: true,
      inputType: 'number',
      cell: (e) => <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(e.amount)}</span>,
    },
    {
      header: 'Submitted By',
      cell: (e) => <span className="text-xs text-gray-500">{e.createdBy?.name || 'Admin'}</span>,
    },
    {
      header: 'Status',
      editableKey: 'status',
      inlineEditable: true,
      cell: (e) => <StatusBadge status={e.status} />,
    },
    {
      header: 'Action',
      cell: (e) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => openEdit(e)}
            className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400"
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
          {e.status === 'PENDING' && (
            <button
              onClick={() => handleApprove(e.id)}
              className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => handleDelete(e.id)}
            className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
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
        const updateBody: any = {};
        for (const [key, value] of Object.entries(fields)) {
          if (key === 'amount') {
            updateBody[key] = Number(value) || 0;
          } else {
            updateBody[key] = value;
          }
        }
        await api.put(`/expenses/${rowId}`, updateBody);
      }
      toast.success(`${Object.keys(grouped).length} expense(s) updated!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

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
        searchPlaceholder="Search expenses..."
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: 'Pending', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' }
        ]}
      />

      {/* Mobile Expense Stats */}
      {stats && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <div className="min-w-[140px] flex-shrink-0 rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Total</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.total || 0)}</p>
          </div>
          <div className="min-w-[140px] flex-shrink-0 rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Average</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(stats.average || 0)}</p>
          </div>
          <div className="min-w-[140px] flex-shrink-0 rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 shadow-sm">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Vouchers</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.count || 0}</p>
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <DataTable 
            columns={columns} 
            data={expenses} 
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
        <div className="space-y-3">
          {isLoading && (
            <div className="text-center py-10 text-gray-500">Loading expenses...</div>
          )}
          {expenses.length === 0 && !isLoading && (
            <div className="text-center py-10 text-gray-500">No expenses found.</div>
          )}
          {expenses.map((e: any) => (
            <div key={e.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Receipt className="h-4 w-4 text-blue-600" />
                    {e.category?.name || 'General'}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">{e.description || 'N/A'}</p>
                </div>
                <StatusBadge status={e.status} />
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <span>Date: {formatDate(e.date)}</span>
                  <p className="mt-0.5">By: {e.createdBy?.name || 'Admin'}</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-gray-900 dark:text-white block">{formatCurrency(e.amount)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 justify-end">
                <button
                  onClick={() => openEdit(e)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 font-semibold text-xs dark:bg-blue-950/40 dark:text-blue-400"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                {e.status === 'PENDING' && (
                  <button
                    onClick={() => handleApprove(e.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 font-semibold text-xs dark:bg-emerald-950/40 dark:text-emerald-400"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                )}
                <button
                  onClick={() => handleDelete(e.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-semibold text-xs dark:bg-rose-950/40 dark:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          <MobilePagination 
            page={page} 
            totalPages={totalPages} 
            totalItems={totalItems}
            onPageChange={setPage} 
          />
        </div>
      )}
      
      {/* Floating Action Button for Create Expense */}
      <button 
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-[88px] right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Create Expense Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto pt-4 pb-20 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Log New Expense
            </h2>
            <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="space-y-6 flex-1">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Category *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !isCustomCategory;
                      setIsCustomCategory(nextState);
                      if (nextState) {
                        setFormData({ ...formData, categoryId: '__NEW__' });
                      } else {
                        setFormData({ ...formData, categoryId: categories[0]?.id || '' });
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {isCustomCategory ? '← Choose Existing' : '+ Add New Category'}
                  </button>
                </div>
                {isCustomCategory ? (
                  <input
                    type="text"
                    required
                    placeholder="Enter new category name (e.g. PACKAGING)..."
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    className="w-full rounded-xl border border-blue-500 bg-blue-50/20 p-2.5 text-sm uppercase font-semibold text-gray-900 dark:border-blue-500 dark:bg-blue-950/20 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <select
                    required
                    value={formData.categoryId || (categories[0]?.id ?? '')}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsCustomCategory(true);
                        setFormData({ ...formData, categoryId: '__NEW__' });
                      } else {
                        setFormData({ ...formData, categoryId: e.target.value });
                      }
                    }}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value="__NEW__" className="font-bold text-blue-600">
                      + Add New Category...
                    </option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-bold"
                />
              </div>

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
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  <option value="">Select Payment Method</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Notes</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  placeholder="e.g. FUEL, JOB VACANCY, supplier name etc."
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
                  Submit Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Edit Expense Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto pt-4 pb-20 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Edit Expense
            </h2>
            <button onClick={() => setIsEditOpen(false)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="space-y-6 flex-1">
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Category *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !isEditCustomCategory;
                      setIsEditCustomCategory(nextState);
                      if (nextState) {
                        setEditData({ ...editData, categoryId: '__NEW__' });
                      } else {
                        setEditData({ ...editData, categoryId: categories[0]?.id || '' });
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {isEditCustomCategory ? '← Choose Existing' : '+ Add New Category'}
                  </button>
                </div>
                {isEditCustomCategory ? (
                  <input
                    type="text"
                    required
                    placeholder="Enter new category name..."
                    value={editCustomCategoryName}
                    onChange={(e) => setEditCustomCategoryName(e.target.value)}
                    className="w-full rounded-xl border border-blue-500 bg-blue-50/20 p-2.5 text-sm uppercase font-semibold text-gray-900 dark:border-blue-500 dark:bg-blue-950/20 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <select
                    required
                    value={editData.categoryId}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsEditCustomCategory(true);
                        setEditData({ ...editData, categoryId: '__NEW__' });
                      } else {
                        setEditData({ ...editData, categoryId: e.target.value });
                      }
                    }}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="__NEW__" className="font-bold text-blue-600">
                      + Add New Category...
                    </option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Date *</label>
                <input
                  type="date"
                  required
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Status</label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Notes</label>
                <textarea
                  rows={2}
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
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
