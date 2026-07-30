'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, FileText, CheckCircle2, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function SalesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create Order Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT');
  const [items, setItems] = useState<any[]>([
    { productId: '', quantity: 10, unitPrice: 350, gstRate: 18 },
  ]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [oRes, cRes, pRes] = await Promise.all([
        api.get(`/sales?page=${page}&limit=10&search=${encodeURIComponent(search)}`),
        api.get('/customers?limit=100'),
        api.get('/inventory?limit=100'),
      ]);
      setOrders(oRes.data.data.data);
      setTotalPages(oRes.data.data.pagination.totalPages);
      setCustomers(cRes.data.data.data);
      setProducts(pRes.data.data.data);
    } catch {
      toast.error('Failed to load sales orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    try {
      await api.post('/sales', {
        customerId,
        paymentMethod,
        items,
      });
      toast.success('Sales order created successfully!');
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error creating order');
    }
  };

  const handleGenerateInvoice = async (orderId: string) => {
    try {
      await api.post(`/sales/${orderId}/invoice`);
      toast.success('GST Invoice generated successfully!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error generating invoice');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Order #',
      accessorKey: 'orderNumber',
      cell: (o) => <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{o.orderNumber}</span>,
    },
    {
      header: 'Customer',
      cell: (o) => <span className="font-semibold text-gray-900 dark:text-white">{o.customer?.name}</span>,
    },
    {
      header: 'Date',
      cell: (o) => <span className="text-xs text-gray-500">{formatDate(o.orderDate)}</span>,
    },
    {
      header: 'Total Amount',
      cell: (o) => <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(o.totalAmount)}</span>,
    },
    {
      header: 'Outstanding',
      cell: (o) => (
        <span className={o.outstanding > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-gray-500'}>
          {formatCurrency(o.outstanding)}
        </span>
      ),
    },
    {
      header: 'Order Status',
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Payment Status',
      cell: (o) => <StatusBadge status={o.paymentStatus} />,
    },
    {
      header: 'Actions',
      cell: (o) => (
        <div className="flex items-center gap-2">
          {!o.invoice ? (
            <button
              onClick={() => handleGenerateInvoice(o.id)}
              className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400"
            >
              <FileText className="h-3.5 w-3.5" /> Invoice
            </button>
          ) : (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Invoiced
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales & Orders</h1>
          <p className="text-sm text-gray-500">Create orders, generate GST invoices, track receivables</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        searchPlaceholder="Search order # or customer..."
        onSearch={(q) => setSearch(q)}
        onAddClick={() => setIsCreateOpen(true)}
        addButtonLabel="Create Sales Order"
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
        isLoading={isLoading}
      />

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Sales Order</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Select Customer *</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Payment Terms</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  >
                    <option value="CREDIT">Credit (On Account)</option>
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  </select>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Order Items</label>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const found = products.find((p) => p.productId === pId || p.product?.id === pId);
                          const price = found?.product?.sellingPrice || 350;
                          const newItems = [...items];
                          newItems[idx] = { ...newItems[idx], productId: pId, unitPrice: price };
                          setItems(newItems);
                        }}
                        className="w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((inv) => (
                          <option key={inv.id} value={inv.product?.id || inv.id}>
                            {inv.product?.name} (Stock: {inv.currentStock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].quantity = Number(e.target.value);
                          setItems(newItems);
                        }}
                        className="w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>

                    <div className="col-span-4">
                      <input
                        type="number"
                        placeholder="Unit Price (₹)"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].unitPrice = Number(e.target.value);
                          setItems(newItems);
                        }}
                        className="w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
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
