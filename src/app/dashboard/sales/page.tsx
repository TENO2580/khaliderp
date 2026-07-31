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
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Create/Edit Order Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT');
  const [items, setItems] = useState<any[]>([
    { productId: '', quantity: 10, unitPrice: 350, gstRate: 18 },
  ]);
  const [editFormData, setEditFormData] = useState({
    batchUsed: '',
    orderDate: '',
    deliveryDate: '',
    type: '',
    productionCost: '',
    sellingCost: '',
    margin: '',
    totalAmount: 0,
    status: 'PENDING',
    outstanding: 0,
    creditNotes: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [oRes, cRes, pRes] = await Promise.all([
        api.get(`/sales?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),
        api.get('/customers?limit=100'),
        api.get('/inventory?limit=100'),
      ]);
      setOrders(oRes.data.data.data);
      setTotalPages(oRes.data.data.pagination.totalPages);
      setCustomers(cRes.data.data.data);
      setProducts(pRes.data.data.data);
    } catch {
      setOrders([]);
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
      if (isEdit) {
        await api.put(`/sales/${editId}`, {
          orderDate: editFormData.orderDate,
          deliveryDate: editFormData.deliveryDate,
          status: editFormData.status,
          totalAmount: editFormData.totalAmount,
          outstanding: editFormData.outstanding,
          quantity: items[0].quantity,
          notes: {
            batchUsed: editFormData.batchUsed,
            type: editFormData.type,
            productionCost: editFormData.productionCost,
            sellingCost: editFormData.sellingCost,
            margin: editFormData.margin,
            creditNotes: editFormData.creditNotes,
          }
        });
        toast.success('Sales order updated successfully!');
      } else {
        await api.post('/sales', {
          customerId,
          paymentMethod,
          items,
        });
        toast.success('Sales order created successfully!');
      }
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

  const parseNotes = (notes: string) => {
    try {
      return JSON.parse(notes);
    } catch {
      return {};
    }
  };

  const handleEditClick = (order: any) => {
    const data = parseNotes(order.notes);
    
    setEditFormData({
      batchUsed: data.batchUsed || '',
      orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : '',
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
      type: data.type || '',
      productionCost: data.productionCost || '',
      sellingCost: data.sellingCost || (order.items?.[0]?.unitPrice || ''),
      margin: data.margin || '',
      totalAmount: order.totalAmount || 0,
      status: order.status || 'PENDING',
      outstanding: order.outstanding || 0,
      creditNotes: data.creditNotes || '',
    });
    
    setCustomerId(order.customerId);
    setItems([
      {
        productId: order.items?.[0]?.productId || '',
        quantity: order.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0,
        unitPrice: order.items?.[0]?.unitPrice || 0,
        gstRate: order.items?.[0]?.gstRate || 18,
      }
    ]);
    setEditId(order.id);
    setIsEdit(true);
    setIsCreateOpen(true);
  };

  const columns: Column<any>[] = [
    {
      header: 'Name',
      cell: (o) => <span className="font-semibold text-gray-900 dark:text-white">{o.customer?.name || 'Unknown'}</span>,
    },
    {
      header: 'Batch Used',
      cell: (o) => {
        const data = parseNotes(o.notes);
        return <span className="text-sm text-gray-600 dark:text-gray-300">{data.batchUsed || '-'}</span>;
      },
    },
    {
      header: 'Order Date',
      cell: (o) => <span className="text-xs text-gray-500">{formatDate(o.orderDate)}</span>,
    },
    {
      header: 'Delivery Date',
      cell: (o) => <span className="text-xs text-gray-500">{o.deliveryDate ? formatDate(o.deliveryDate) : '-'}</span>,
    },
    {
      header: 'TYPE',
      cell: (o) => {
        const data = parseNotes(o.notes);
        return <span className="text-sm text-gray-600 dark:text-gray-300">{data.type || '-'}</span>;
      },
    },
    {
      header: 'Quantity (KG)',
      cell: (o) => {
        const qty = o.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
        return <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{qty.toFixed(2)}</span>;
      },
    },
    {
      header: 'Production Cost',
      cell: (o) => {
        const data = parseNotes(o.notes);
        return <span className="text-sm text-gray-600 dark:text-gray-300">{data.productionCost ? `₹${data.productionCost}` : '-'}</span>;
      },
    },
    {
      header: 'Selling Cost',
      cell: (o) => {
        const data = parseNotes(o.notes);
        return <span className="text-sm text-gray-600 dark:text-gray-300">{data.sellingCost ? `₹${data.sellingCost}` : (o.items?.[0]?.unitPrice ? formatCurrency(o.items[0].unitPrice) : '-')}</span>;
      },
    },
    {
      header: 'Margin % & Amount',
      cell: (o) => {
        const data = parseNotes(o.notes);
        return <span className="text-sm text-gray-600 dark:text-gray-300">{data.margin || '-'}</span>;
      },
    },
    {
      header: 'Total Selling Cost',
      cell: (o) => <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(o.totalAmount)}</span>,
    },
    {
      header: 'Status',
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Credit',
      cell: (o) => {
        const data = parseNotes(o.notes);
        if (data.creditNotes) {
           return <span className="text-sm text-rose-600 font-medium">{data.creditNotes}</span>;
        }
        return (
          <span className={o.outstanding > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-gray-500'}>
            {formatCurrency(o.outstanding)}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      cell: (o) => (
        <button
          onClick={() => handleEditClick(o)}
          className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50"
          title="Edit Order"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </button>
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

      <DataTable limit={limit} onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={orders}
        searchPlaceholder="Search order # or customer..."
        onSearch={(q) => setSearch(q)}
        onAddClick={() => {
          setIsEdit(false);
          setCustomerId('');
          setItems([{ productId: '', quantity: 10, unitPrice: 350, gstRate: 18 }]);
          setIsCreateOpen(true);
        }}
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

              <div className="grid grid-cols-2 gap-4">
                {isEdit && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Order Date</label>
                      <input
                        type="date"
                        value={editFormData.orderDate}
                        onChange={(e) => setEditFormData({ ...editFormData, orderDate: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Delivery Date</label>
                      <input
                        type="date"
                        value={editFormData.deliveryDate}
                        onChange={(e) => setEditFormData({ ...editFormData, deliveryDate: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Batch Used</label>
                      <input
                        type="text"
                        value={editFormData.batchUsed}
                        onChange={(e) => setEditFormData({ ...editFormData, batchUsed: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Type</label>
                      <input
                        type="text"
                        value={editFormData.type}
                        onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Production Cost (₹)</label>
                      <input
                        type="text"
                        value={editFormData.productionCost}
                        onChange={(e) => setEditFormData({ ...editFormData, productionCost: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Selling Cost (₹)</label>
                      <input
                        type="text"
                        value={editFormData.sellingCost}
                        onChange={(e) => setEditFormData({ ...editFormData, sellingCost: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Margin % & Amount</label>
                      <input
                        type="text"
                        value={editFormData.margin}
                        onChange={(e) => setEditFormData({ ...editFormData, margin: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Total Selling Cost (₹)</label>
                      <input
                        type="number"
                        value={editFormData.totalAmount}
                        onChange={(e) => setEditFormData({ ...editFormData, totalAmount: Number(e.target.value) })}
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Outstanding Credit (₹)</label>
                      <input
                        type="number"
                        value={editFormData.outstanding}
                        onChange={(e) => setEditFormData({ ...editFormData, outstanding: Number(e.target.value) })}
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Credit Notes</label>
                      <input
                        type="text"
                        value={editFormData.creditNotes}
                        onChange={(e) => setEditFormData({ ...editFormData, creditNotes: e.target.value })}
                        placeholder="e.g. 5000(friday)"
                        className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                      />
                    </div>
                  </>
                )}
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
