'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Truck, Plus, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function PurchasePage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    setIsLoading(false);
    // Mock purchase orders for demonstration
    setOrders([
      {
        id: '1',
        poNumber: 'PO-2026-0001',
        supplierName: 'Wax Industries Pvt Ltd',
        orderDate: new Date().toISOString(),
        material: 'Paraffin Wax (500 KG)',
        totalAmount: 42500,
        status: 'RECEIVED',
        paymentStatus: 'PAID',
      },
      {
        id: '2',
        poNumber: 'PO-2026-0002',
        supplierName: 'Fragrance World',
        orderDate: new Date().toISOString(),
        material: 'Lavender Oils (50 LTR)',
        totalAmount: 20000,
        status: 'ORDERED',
        paymentStatus: 'UNPAID',
      },
    ]);
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPo = {
      id: Date.now().toString(),
      poNumber: `PO-2026-000${orders.length + 1}`,
      supplierName: formData.supplierName,
      orderDate: new Date().toISOString(),
      material: `${formData.material} (${formData.quantity} Units)`,
      totalAmount: formData.quantity * formData.unitPrice,
      status: 'ORDERED',
      paymentStatus: 'UNPAID',
    };
    setOrders([newPo, ...orders]);
    toast.success('Purchase Order created!');
    setIsCreateOpen(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders & Procurement</h1>
          <p className="text-sm text-gray-500">Manage raw material suppliers, purchase orders & vendor payments</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Search PO # or supplier..."
        onSearch={(q) => setSearch(q)}
        onAddClick={() => setIsCreateOpen(true)}
        addButtonLabel="Create Purchase Order"
        isLoading={isLoading}
      />

      {/* Create PO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Purchase Order</h2>
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
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Unit Price (₹)</label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
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
