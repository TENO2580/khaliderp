'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Plus, Filter, ArrowUpRight, X, Truck, CheckCircle2, LayoutGrid, Table, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useViewMode } from '@/hooks/useViewMode';
import MobileFilterBar from './MobileFilterBar';
import MobilePagination from './MobilePagination';

export default function MobilePurchase() {
  const { viewMode, toggleViewMode } = useViewMode();
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
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
      const res = await api.get(`/purchase?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`);
      setOrders(res.data.data.data || []);
      setTotalPages(res.data.data.pagination?.totalPages || 1);
      setTotalItems(res.data.data.pagination?.total || 0);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, page, limit, startDate, endDate, statusFilter]);

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
        searchPlaceholder="Search POs..."
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
          { label: 'Cancelled', value: 'CANCELLED' }
        ]}
      />

      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <DataTable 
            columns={columns} 
            data={orders} 
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
        {orders.length === 0 && !isLoading && (
          <div className="text-center py-10 text-gray-500">No purchase orders found.</div>
        )}
        {orders.map((o: any) => (
          <div key={o.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{o.poNumber}</div>
                <div className="font-semibold text-gray-900 dark:text-white mt-1">{o.supplierName}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={o.status} />
                <button
                  onClick={() => handleEditClick(o)}
                  className="rounded-lg p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(o.id)}
                  className="rounded-lg p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {formatDate(o.orderDate)}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {o.material || 'Various Items'}
              </span>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(o.totalAmount)}
              </div>
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
      
      {/* Floating Action Button for Create PO */}
      <button 
        onClick={() => {
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
        className="fixed bottom-[88px] right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Create / Edit PO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto pt-4 pb-20 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h2>
            <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="space-y-6 flex-1">
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
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
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
