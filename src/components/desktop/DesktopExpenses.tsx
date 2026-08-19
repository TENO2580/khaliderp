'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, Check, Plus, CreditCard, Edit3, Trash2, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetcher = (url: string) => api.get(url).then(res => res.data?.data ?? res.data);

export default function DesktopExpenses() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expense Tracker</h1>
          <p className="text-sm text-gray-500">Track fuel, salary, electricity, gas & operational expenses</p>
        </div>
      </div>

      {/* Expense Stats Bar */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Approved Expenses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(stats.total || 0)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Average Expense</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(stats.average || 0)}</p>
          </div>
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Vouchers</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.count || 0}</p>
          </div>
        </div>
      )}

      <DataTable
        totalItems={totalItems}
        limit={limit}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={expenses}
        searchPlaceholder="Search expense description..."
        onSearch={setSearch}
        onAddClick={() => setIsCreateOpen(true)}
        addButtonLabel="Record Expense"
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: 'Pending', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
        ]}
        enableInlineEdit={true}
        onBatchSave={handleBatchSave}
      />

      {/* Add Expense Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Record New Expense</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
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
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Notes / Description</label>
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
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-md"
                >
                  Submit Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Expense</h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
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
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Notes / Description</label>
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
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-md"
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
