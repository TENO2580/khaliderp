'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, customerTypeLabels } from '@/lib/utils';
import { MessageCircle, MapPin, Phone, Mail, Plus, Filter, Download } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    whatsapp: '',
    email: '',
    gstNumber: '',
    address: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    type: 'RETAILER',
    creditLimit: 50000,
    status: 'ACTIVE',
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/customers?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      setCustomers(res.data.data.data);
      setTotalPages(res.data.data.pagination.totalPages);
      setTotalItems(res.data.data.pagination.total);
    } catch {
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      toast.success('Customer created successfully!');
      setIsCreateOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating customer');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Sl No.',
      accessorKey: 'customerId',
      cell: (c) => <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{c.customerId}</span>,
    },
    {
      header: 'Name',
      cell: (c) => (
        <span className="font-semibold text-gray-900 dark:text-white">{c.name}</span>
      ),
    },
    {
      header: 'Location',
      cell: (c) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {[c.district, c.state].filter(Boolean).join(', ') || c.address || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: (c) => <span className="text-sm text-gray-600 dark:text-gray-300">{c.phone || 'N/A'}</span>,
    },
    {
      header: 'Last Order',
      cell: (c) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString('en-IN') : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Next Follow-Up',
      cell: (c) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {c.nextFollowupDate ? new Date(c.nextFollowupDate).toLocaleDateString('en-IN') : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Current Status',
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      header: 'Notes',
      cell: (c) => (
        <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[150px] inline-block" title={c.notes}>
          {c.notes || '-'}
        </span>
      ),
    },
    {
      header: 'Last Selling Cost',
      cell: (c) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {c.sellingPrice ? formatCurrency(c.sellingPrice) : '-'}
        </span>
      ),
    },
    {
      header: 'Category',
      cell: (c) => (
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {customerTypeLabels[c.type] || c.type}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer CRM</h1>
          <p className="text-sm text-gray-500">Manage distributors, wholesalers, retailers & leads</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search by name, ID, phone..."
        onSearch={(q) => {
          setSearch(q);
          setPage(1);
        }}
        onAddClick={() => setIsCreateOpen(true)}
        addButtonLabel="Add Customer"
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={(p) => setPage(p)}
        isLoading={isLoading}
      />

      {/* Create Customer Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add New Customer</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Owner Name</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Customer Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="RETAILER">Retailer</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                    <option value="WHOLESALER">Wholesaler</option>
                    <option value="DEALER">Dealer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">GST Number</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
