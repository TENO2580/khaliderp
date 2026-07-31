'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, customerTypeLabels } from '@/lib/utils';
import { MessageCircle, MapPin, Phone, Mail, Plus, Filter, Download, Pencil } from 'lucide-react';
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
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState('');
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
    district: '',
    state: 'Tamil Nadu',
    notes: '',
    sellingPrice: 0,
    nextFollowupDate: '',
    lastPurchaseDate: '',
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
      if (isEdit) {
        await api.put(`/customers/${editId}`, formData);
        toast.success('Customer updated successfully!');
      } else {
        await api.post('/customers', formData);
        toast.success('Customer created successfully!');
      }
      setIsCreateOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isEdit ? 'Error updating customer' : 'Error creating customer'));
    }
  };

  const handleEditClick = (customer: any) => {
    setFormData({
      name: customer.name || '',
      ownerName: customer.ownerName || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      gstNumber: customer.gstNumber || '',
      address: customer.address || '',
      district: customer.district || '',
      state: customer.state || 'Tamil Nadu',
      pincode: customer.pincode || '',
      type: customer.type || 'RETAILER',
      creditLimit: customer.creditLimit || 50000,
      status: customer.status || 'ACTIVE',
      notes: customer.notes || '',
      sellingPrice: customer.sellingPrice || 0,
      nextFollowupDate: customer.nextFollowupDate ? new Date(customer.nextFollowupDate).toISOString().split('T')[0] : '',
      lastPurchaseDate: customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toISOString().split('T')[0] : '',
    });
    setEditId(customer.id);
    setIsEdit(true);
    setIsCreateOpen(true);
  };

  const handleExport = () => {
    const csvContent = [
      ['Sl No.', 'Name', 'Location', 'Phone', 'Last Order', 'Next Follow-Up', 'Current Status', 'Notes', 'Last Selling Cost', 'Category'],
      ...customers.map(c => [
        c.customerId,
        `"${c.name || ''}"`,
        `"${[c.district, c.state].filter(Boolean).join(', ') || c.address || 'N/A'}"`,
        c.phone || 'N/A',
        c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString('en-IN') : 'N/A',
        c.nextFollowupDate ? new Date(c.nextFollowupDate).toLocaleDateString('en-IN') : 'N/A',
        c.status,
        `"${c.notes || ''}"`,
        c.sellingPrice || 0,
        customerTypeLabels[c.type] || c.type
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'customers.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    {
      header: 'Actions',
      cell: (c) => (
        <button
          onClick={() => handleEditClick(c)}
          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50"
          title="Edit Customer"
        >
          <Pencil className="h-4 w-4" />
        </button>
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
        onAddClick={() => {
          setFormData({
            name: '', ownerName: '', phone: '', whatsapp: '', email: '', gstNumber: '',
            address: '', district: '', state: 'Tamil Nadu', pincode: '', type: 'RETAILER',
            creditLimit: 50000, status: 'ACTIVE', notes: '', sellingPrice: 0, nextFollowupDate: '', lastPurchaseDate: ''
          });
          setIsEdit(false);
          setIsCreateOpen(true);
        }}
        addButtonLabel="Add Customer"
        onExportClick={handleExport}
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
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {isEdit ? 'Edit Customer' : 'Add New Customer'}
            </h2>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="LEAD">Lead</option>
                    <option value="LOST">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Last Selling Cost (₹)</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Last Order Date</label>
                  <input
                    type="date"
                    value={formData.lastPurchaseDate}
                    onChange={(e) => setFormData({ ...formData, lastPurchaseDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Next Follow-Up</label>
                  <input
                    type="date"
                    value={formData.nextFollowupDate}
                    onChange={(e) => setFormData({ ...formData, nextFollowupDate: e.target.value })}
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  {isEdit ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
