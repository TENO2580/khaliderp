'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Truck, Plus, CheckCircle2, Pencil, Trash2, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function DesktopPurchase() {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const totalItems = orders.length;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [formData, setFormData] = useState({
    supplierName: 'Wax Industries Pvt Ltd',
    gstNumber: '33AABCT1234A1ZA',
    material: 'Paraffin Wax',
    quantity: 500,
    unitPrice: 85,
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    status: 'DRAFT',
    paymentStatus: 'UNPAID',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/purchase?search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`);
      setOrders(res.data.data.data);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, limit, startDate, endDate, statusFilter]);

  const handleEditClick = (p: any) => {
    setIsEdit(true);
    setEditId(p.id);
    let orderDateStr = new Date().toISOString().split('T')[0];
    if (p.orderDate) {
      try {
        orderDateStr = new Date(p.orderDate).toISOString().split('T')[0];
      } catch {
        orderDateStr = String(p.orderDate).slice(0, 10);
      }
    }
    let expectedDateStr = '';
    if (p.expectedDate) {
      try {
        expectedDateStr = new Date(p.expectedDate).toISOString().split('T')[0];
      } catch {
        expectedDateStr = String(p.expectedDate).slice(0, 10);
      }
    }

    setFormData({
      supplierName: p.supplierName || '',
      gstNumber: p.gstNumber || '33AABCT1234A1ZA',
      material: p.rawMaterialName || (p.material ? p.material.split(' (')[0] : 'Paraffin Wax'),
      quantity: p.quantity || 500,
      unitPrice: p.unitPrice || 85,
      orderDate: orderDateStr,
      expectedDate: expectedDateStr,
      status: p.status || 'DRAFT',
      paymentStatus: p.paymentStatus || 'UNPAID',
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase order? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/purchase/${id}`);
      toast.success('Purchase order deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete purchase order');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/purchase/${editId}`, formData);
        toast.success('Purchase Order updated successfully!');
      } else {
        await api.post('/purchase', formData);
        toast.success('Purchase Order created successfully!');
      }
      setIsCreateOpen(false);
      setIsEdit(false);
      setEditId('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving purchase order');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'PO #',
      accessorKey: 'poNumber',
      cell: (p) => <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{p.poNumber}</span>,
    },
    {
      header: 'Supplier',
      cell: (p) => <span className="font-semibold text-gray-900 dark:text-white">{p.supplierName}</span>,
    },
    {
      header: 'Material / Qty',
      accessorKey: 'material',
      cell: (p) => <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.material}</span>,
    },
    {
      header: 'Order Date',
      cell: (p) => <span className="text-xs text-gray-500">{formatDate(p.orderDate)}</span>,
    },
    {
      header: 'Total Cost',
      cell: (p) => <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(p.totalAmount)}</span>,
    },
    {
      header: 'PO Status',
      cell: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Payment',
      cell: (p) => <StatusBadge status={p.paymentStatus} />,
    },
    {
      header: 'Actions',
      cell: (p) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditClick(p)}
            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
            title="Edit Purchase Order"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(p.id)}
            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors"
            title="Delete Purchase Order"
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders & Procurement</h1>
          <p className="text-sm text-gray-500">Manage raw material suppliers, purchase orders & vendor payments</p>
        </div>
      </div>

      <DataTable
        totalItems={totalItems}
        limit={limit}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={orders}
        searchPlaceholder="Search PO # or supplier..."
        onSearch={setSearch}
        onAddClick={() => {
          setIsEdit(false);
          setEditId('');
          setFormData({
            supplierName: 'Wax Industries Pvt Ltd',
            gstNumber: '33AABCT1234A1ZA',
            material: 'Paraffin Wax',
            quantity: 500,
            unitPrice: 85,
            orderDate: new Date().toISOString().split('T')[0],
            expectedDate: '',
            status: 'DRAFT',
            paymentStatus: 'UNPAID',
          });
          setIsCreateOpen(true);
        }}
        addButtonLabel="Create Purchase Order"
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Ordered', value: 'ORDERED' },
          { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
          { label: 'Received', value: 'RECEIVED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ]}
      />

      {/* Create / Edit PO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {isEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Raw Material Item *</label>
                <input
                  type="text"
                  required
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Expected Delivery</label>
                  <input
                    type="date"
                    value={formData.expectedDate}
                    min={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Unit Price (₹)</label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  />
                </div>
              </div>

              {isEdit && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">PO Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-semibold"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="ORDERED">Ordered</option>
                      <option value="PARTIALLY_RECEIVED">Partially Received</option>
                      <option value="RECEIVED">Received</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Payment Status</label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white font-semibold"
                    >
                      <option value="UNPAID">Unpaid</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                      <option value="OVERDUE">Overdue</option>
                    </select>
                  </div>
                </div>
              )}

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
                  {isEdit ? 'Save Changes' : 'Submit Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
