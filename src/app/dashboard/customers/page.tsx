'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, customerTypeLabels } from '@/lib/utils';
import { MessageCircle, MapPin, Phone, Mail, Plus, Filter, Download, Pencil } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
    route: '',
    type: 'RETAILER',
    creditLimit: 50000,
    status: 'ACTIVE',
    notes: '',
    sellingPrice: 0,
    nextFollowupDate: '',
    lastPurchaseDate: '',
  });

  const { data: resData, mutate: mutateCustomers, isLoading } = useSWR(
    `/customers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`,
    fetcher
  );

  const customers = resData?.data || [];
  const totalPages = resData?.pagination?.totalPages || 1;
  const totalItems = resData?.pagination?.total || 0;

  const fetchCustomers = () => {
    mutateCustomers();
  };

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
      route: customer.route || '',
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

  const handleExport = async (mode: 'visible' | 'all' = 'all', visibleHeaders: string[] = []) => {
    try {
      const toastId = toast.loading('Exporting customers...');
      const res = await api.get(`/customers?limit=10000&search=${encodeURIComponent(search)}&status=${statusFilter}`);
      const exportData = res.data.data.data || [];

      const allHeaders = ['Sl No.', 'Name', 'Location', 'Phone', 'Last Order', 'Next Follow-Up', 'Current Status', 'Notes', 'Last Selling Cost', 'Category'];
      const headersToExport = mode === 'visible' ? allHeaders.filter(h => visibleHeaders.includes(h)) : allHeaders;

      if (headersToExport.length === 0) {
        toast.dismiss(toastId);
        toast.error('No columns to export');
        return;
      }

      const csvContent = [
        headersToExport,
        ...exportData.map((c: any) => {
          const fullRow = {
            'Sl No.': c.customerId,
            'Name': `"${c.name || ''}"`,
            'Location': `"${[c.district, c.state].filter(Boolean).join(', ') || c.address || 'N/A'}"`,
            'Phone': c.phone || 'N/A',
            'Last Order': c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString('en-IN') : 'N/A',
            'Next Follow-Up': c.nextFollowupDate ? new Date(c.nextFollowupDate).toLocaleDateString('en-IN') : 'N/A',
            'Current Status': c.status,
            'Notes': `"${(c.notes || '').replace(/"/g, '""')}"`,
            'Last Selling Cost': c.sellingPrice || 0,
            'Category': customerTypeLabels[c.type as keyof typeof customerTypeLabels] || c.type
          };
          return headersToExport.map(h => fullRow[h as keyof typeof fullRow]);
        })
      ].map(e => e.join(",")).join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.dismiss(toastId);
      toast.success('Export successful');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to export customers');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Name',
      editableKey: 'name',
      inlineEditable: true,
      cell: (c) => (
        <span className="font-semibold text-gray-900 dark:text-white">{c.name}</span>
      ),
    },
    {
      header: 'Sl No.',
      accessorKey: 'customerId',
      cell: (c) => <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{c.customerId}</span>,
    },
    {
      header: 'Location',
      editableKey: 'district',
      inlineEditable: true,
      cell: (c) => (
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {[c.district, c.state].filter(Boolean).join(', ') || c.address || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      editableKey: 'phone',
      inlineEditable: true,
      inputType: 'number',
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
      editableKey: 'status',
      inlineEditable: true,
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      header: 'Notes',
      editableKey: 'notes',
      inlineEditable: true,
      cell: (c) => (
        <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[150px] inline-block" title={c.notes}>
          {c.notes || '-'}
        </span>
      ),
    },
    {
      header: 'Last Selling Cost',
      editableKey: 'sellingPrice',
      inlineEditable: true,
      inputType: 'number',
      cell: (c) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {c.sellingPrice ? formatCurrency(c.sellingPrice) : '-'}
        </span>
      ),
    },
    {
      header: 'Category',
      editableKey: 'type',
      inlineEditable: true,
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
          if (key === 'sellingPrice' || key === 'creditLimit') {
            updateBody[key] = Number(value) || 0;
          } else {
            updateBody[key] = value;
          }
        }
        await api.put(`/customers/${rowId}`, updateBody);
      }
      toast.success(`${Object.keys(grouped).length} customer(s) updated!`);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer CRM</h1>
          <p className="text-sm text-gray-500">Manage distributors, wholesalers, retailers & leads</p>
        </div>
      </div>

      <DataTable
        limit={limit}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
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
            address: '', district: '', state: 'Tamil Nadu', pincode: '', route: '', type: 'RETAILER',
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
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
          { label: 'Lead', value: 'LEAD' },
          { label: 'Lost', value: 'LOST' },
        ]}
        enableInlineEdit={true}
        onBatchSave={handleBatchSave}
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
                    onChange={(e) => setFormData({ ...formData, creditLimit: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
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
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Location / District</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value, state: '' })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Route / Area (e.g. Areekode)</label>
                  <input
                    type="text"
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, sellingPrice: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
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
