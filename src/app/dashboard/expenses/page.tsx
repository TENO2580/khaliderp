'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, Check, Plus, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  // Add Expense Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [eRes, cRes, sRes] = await Promise.all([
        api.get(`/expenses?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`),
        api.get('/expenses/categories'),
        api.get('/expenses/stats'),
      ]);
      setExpenses(eRes.data.data.data);
      setTotalPages(eRes.data.data.pagination?.totalPages || 1);      setCategories(cRes.data.data);
      setStats(sRes.data.data);
      if (cRes.data.data?.length > 0) {
        setFormData((prev) => ({ ...prev, categoryId: cRes.data.data[0].id }));
      }
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, limit, startDate, endDate, statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error('Please select an expense category');
      return;
    }
    try {
      const descParts = [formData.description, formData.paymentMethod ? `Payment: ${formData.paymentMethod}` : ''].filter(Boolean).join(' | ');
      await api.post('/expenses', { ...formData, description: descParts || formData.description });
      toast.success('Expense recorded successfully!');
      setIsCreateOpen(false);
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

  const columns: Column<any>[] = [
    {
      header: 'Category',
      cell: (e) => (
        <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Receipt className="h-4 w-4 text-blue-600" />
          {e.category?.name}
        </span>
      ),
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: (e) => <span className="text-xs text-gray-600 dark:text-gray-400">{e.description || 'N/A'}</span>,
    },
    {
      header: 'Date',
      cell: (e) => <span className="text-xs text-gray-500">{formatDate(e.date)}</span>,
    },
    {
      header: 'Amount',
      cell: (e) => <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(e.amount)}</span>,
    },
    {
      header: 'Submitted By',
      cell: (e) => <span className="text-xs text-gray-500">{e.createdBy?.name || 'Admin'}</span>,
    },
    {
      header: 'Status',
      cell: (e) => <StatusBadge status={e.status} />,
    },
    {
      header: 'Action',
      cell: (e) =>
        e.status === 'PENDING' ? (
          <button
            onClick={() => handleApprove(e.id)}
            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
          >
            <Check className="h-3.5 w-3.5" /> Approve
          </button>
        ) : (
          <span className="text-xs text-gray-400">Approved</span>
        ),
    },
  ];

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
      />

      {/* Add Expense Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Record New Expense</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
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
    </div>
  );
}
