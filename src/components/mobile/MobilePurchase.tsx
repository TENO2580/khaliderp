'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Plus, Filter, ArrowUpRight, X, Truck, CheckCircle2, LayoutGrid, Table } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    supplierName: 'Wax Industries Pvt Ltd',
    gstNumber: '33AABCT1234A1ZA',
    material: 'Paraffin Wax',
    quantity: 500,
    unitPrice: 85,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/purchase?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`);
      setOrders(res.data.data.data);
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/purchase', formData);
      toast.success('Purchase Order created!');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating PO');
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
          { label: 'Pending', value: 'PENDING' },
          { label: 'Delivered', value: 'DELIVERED' },
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
                <div className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{o.purchaseNumber}</div>
                <div className="font-semibold text-gray-900 dark:text-white mt-1">{o.supplier?.name}</div>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {formatDate(o.date)}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {o.items?.[0]?.material || 'Various Items'}
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
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-[88px] right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 transition-colors z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Create PO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-y-auto pt-4 pb-20 px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Create Purchase Order
            </h2>
            <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-800">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="space-y-6 flex-1">
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Raw Material Item *</label>
                <input
                  type="text"
                  required
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Unit Price (₹)</label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: (e.target.value === '' ? '' : Number(e.target.value)) as any })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
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
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
