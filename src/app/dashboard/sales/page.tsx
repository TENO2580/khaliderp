'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, FileText, CheckCircle2, DollarSign, X } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function SalesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      const [oRes, cRes, pRes, bRes] = await Promise.all([
        api.get(`/sales?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`),
        api.get('/customers?limit=100'),
        api.get('/inventory?limit=100'),
        api.get('/production/batches'),
      ]);
      setOrders(oRes.data.data.data);
      setTotalPages(oRes.data.data.pagination.totalPages);
      setTotalItems(oRes.data.data.pagination.total);
      setCustomers(cRes.data.data.data);
      setProducts(pRes.data.data.data);
      setBatches(Array.isArray(bRes.data.data) ? bRes.data.data : bRes.data.data?.data || []);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, limit, startDate, endDate, statusFilter]);

  // FIFO Batch Calculation (just for batch tracking)
  useEffect(() => {
    if (!isEdit && batches.length > 0 && items[0].productId) {
      const qty = Number(items[0].quantity) || 0;
      
      const availableBatches = batches
        .filter(b => (b.productId === items[0].productId || b.productId === null) && b.remainingQty > 0)
        .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

      let remainingToFulfill = qty;
      let usedBatchNumbers: string[] = [];

      for (const batch of availableBatches) {
        if (remainingToFulfill <= 0) break;
        const allocated = Math.min(remainingToFulfill, batch.remainingQty);
        usedBatchNumbers.push(batch.batchNumber);
        remainingToFulfill -= allocated;
      }
      
      const selectedProduct = products.find(p => (p.product?.id || p.id) === items[0].productId);
      const typeName = selectedProduct?.product?.name || '';

      setEditFormData(prev => {
        const batchUsedStr = usedBatchNumbers.join(', ');
        if (prev.batchUsed !== batchUsedStr || (prev.type === '' && typeName)) {
           return {
             ...prev,
             batchUsed: batchUsedStr,
             type: prev.type || typeName
           };
        }
        return prev;
      });
    }
  }, [items, batches, isEdit, products]);

  // Auto-calculate Totals and Margins based on Unit inputs
  useEffect(() => {
    const qty = Number(items[0].quantity) || 0;
    const unitSellingPrice = Number(items[0].unitPrice) || 0;
    const unitProdCost = Number(editFormData.productionCost) || 0;
    
    const totalSellingCost = qty * unitSellingPrice;
    const totalProdCost = qty * unitProdCost;
    
    setEditFormData(prev => ({ ...prev, totalAmount: totalSellingCost }));

    if (totalSellingCost > 0 || totalProdCost > 0) {
      const marginAmt = totalSellingCost - totalProdCost;
      const marginPct = totalSellingCost > 0 ? ((marginAmt / totalSellingCost) * 100).toFixed(2) : '0';
      const marginStr = `${marginPct}% (₹${marginAmt.toFixed(2)})`;
      
      if (editFormData.margin !== marginStr) {
        setEditFormData(prev => ({ ...prev, margin: marginStr }));
      }
    } else if (editFormData.margin !== '') {
      setEditFormData(prev => ({ ...prev, margin: '' }));
    }
  }, [items, editFormData.productionCost]);

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
        let itemsToSend: any[] = [];
        const qty = Number(items[0].quantity) || 0;
        const availableBatches = batches
          .filter(b => (b.productId === items[0].productId || b.productId === null) && b.remainingQty > 0)
          .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

        let remainingToFulfill = qty;

        for (const batch of availableBatches) {
          if (remainingToFulfill <= 0) break;
          const allocated = Math.min(remainingToFulfill, batch.remainingQty);
          itemsToSend.push({
            ...items[0],
            batchId: batch.id,
            quantity: allocated,
          });
          remainingToFulfill -= allocated;
        }

        if (remainingToFulfill > 0) {
          itemsToSend.push({
            ...items[0],
            batchId: undefined,
            quantity: remainingToFulfill,
          });
        }

        await api.post('/sales', {
          customerId,
          paymentMethod,
          items: itemsToSend,
          orderDate: editFormData.orderDate,
          deliveryDate: editFormData.deliveryDate,
          status: editFormData.status,
          notes: {
            batchUsed: editFormData.batchUsed,
            type: editFormData.type,
            productionCost: editFormData.productionCost,
            sellingCost: editFormData.sellingCost,
            margin: editFormData.margin,
            creditNotes: editFormData.creditNotes,
          }
        });
        toast.success('Sales order created successfully!');
      }
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      const detail = err.response?.data?.errors?.detail || err.response?.data?.message || err.message || 'Error creating order';
      console.error('Create order error:', err.response?.data || err);
      toast.error(detail);
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

  const handleBatchSave = async (edits: { rowId: string; key: string; value: string }[]) => {
    try {
      // Group edits by rowId
      const grouped: Record<string, Record<string, string>> = {};
      for (const edit of edits) {
        if (!grouped[edit.rowId]) grouped[edit.rowId] = {};
        grouped[edit.rowId][edit.key] = edit.value;
      }

      const notesKeys = ['batchUsed', 'type', 'productionCost', 'sellingCost', 'margin', 'creditNotes'];
      const directKeys = ['totalAmount', 'outstanding', 'status'];

      for (const [rowId, fields] of Object.entries(grouped)) {
        const order = orders.find((o) => o.id === rowId);
        if (!order) continue;

        const existingNotes = parseNotes(order.notes);
        let updateBody: any = {};
        const newNotes = { ...existingNotes };
        let hasNotesChange = false;

        for (const [key, value] of Object.entries(fields)) {
          if (notesKeys.includes(key)) {
            newNotes[key] = value;
            hasNotesChange = true;
            if (key === 'totalAmount') {
              updateBody.totalAmount = Number(value) || 0;
            }
          } else if (directKeys.includes(key)) {
            updateBody[key] = key === 'totalAmount' || key === 'outstanding' ? Number(value) || 0 : value;
          } else if (key === 'quantity') {
            updateBody.quantity = Number(value) || 0;
          }
        }

        // Auto-calc margin from the final values
        const prodCost = Number(newNotes.productionCost || existingNotes.productionCost) || 0;
        const totalSelling = updateBody.totalAmount !== undefined ? updateBody.totalAmount : (order.totalAmount || 0);
        if (prodCost > 0 || totalSelling > 0) {
          const marginAmt = totalSelling - prodCost;
          const marginPct = totalSelling > 0 ? ((marginAmt / totalSelling) * 100).toFixed(2) : '0';
          newNotes.margin = `${marginPct}% (\u20b9${marginAmt.toFixed(2)})`;
          hasNotesChange = true;
        }

        if (hasNotesChange) {
          updateBody.notes = newNotes;
        }

        await api.put(`/sales/${rowId}`, updateBody);
      }

      toast.success(`${Object.keys(grouped).length} order(s) updated successfully!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Name',
      cell: (o) => <span className="font-semibold text-gray-900 dark:text-white">{o.customer?.name || 'Unknown'}</span>,
    },
    {
      header: 'Batch Used',
      editableKey: 'batchUsed',
      inlineEditable: true,
      cell: (o) => {
        const data = parseNotes(o.notes);
        return <span className="text-sm text-gray-900 dark:text-gray-100">{data.batchUsed || '-'}</span>;
      },
    },
    {
      header: 'Order Date',
      cell: (o) => <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(o.orderDate)}</span>,
    },
    {
      header: 'Delivery Date',
      cell: (o) => <span className="text-sm text-gray-900 dark:text-gray-100">{o.deliveryDate ? formatDate(o.deliveryDate) : '-'}</span>,
    },
    {
      header: 'TYPE',
      editableKey: 'type',
      inlineEditable: true,
      cell: (o) => {
        const data = parseNotes(o.notes);
        return <span className="text-sm text-gray-900 dark:text-gray-100">{data.type || '-'}</span>;
      },
    },
    {
      header: 'Quantity (KG)',
      editableKey: 'quantity',
      inlineEditable: true,
      inputType: 'number',
      cell: (o) => {
        const qty = o.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
        return <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{qty.toFixed(2)}</span>;
      },
    },
    {
      header: 'Production Cost',
      editableKey: 'productionCost',
      inlineEditable: true,
      inputType: 'number',
      cell: (o) => {
        const data = parseNotes(o.notes);
        return <span className="text-sm text-gray-900 dark:text-gray-100">{data.productionCost ? `₹${data.productionCost}` : '-'}</span>;
      },
    },
    {
      header: 'Selling Cost',
      editableKey: 'sellingCost',
      inlineEditable: true,
      inputType: 'number',
      cell: (o) => {
        const data = parseNotes(o.notes);
        return <span className="text-sm text-gray-900 dark:text-gray-100">{data.sellingCost ? `₹${data.sellingCost}` : (o.items?.[0]?.unitPrice ? formatCurrency(o.items[0].unitPrice) : '-')}</span>;
      },
    },
    {
      header: 'Margin % & Amount',
      cell: (o) => {
        const data = parseNotes(o.notes);
        return <span className="text-sm text-gray-900 dark:text-gray-100">{data.margin || '-'}</span>;
      },
    },
    {
      header: 'Total Selling Cost',
      editableKey: 'totalAmount',
      inlineEditable: true,
      inputType: 'number',
      cell: (o) => <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(o.totalAmount)}</span>,
    },
    {
      header: 'Status',
      editableKey: 'status',
      inlineEditable: true,
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: 'Credit',
      editableKey: 'creditNotes',
      inlineEditable: true,
      inputType: 'number',
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

      <DataTable totalItems={totalItems}
        columns={columns}
        data={orders}
        searchPlaceholder="Search order # or customer..."
        onSearch={setSearch}
        onAddClick={() => {
          setIsEdit(false);
          setCustomerId('');
          setItems([{ productId: products[0]?.product?.id || products[0]?.id || '', quantity: '', unitPrice: 350, gstRate: 18 }]);
          setEditFormData({
            batchUsed: '',
            orderDate: new Date().toISOString().split('T')[0],
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
          setIsCreateOpen(true);
        }}
        addButtonLabel="Create Sales Order"
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
        limit={limit}
        onLimitChange={setLimit}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { label: 'Pending', value: 'PENDING' },
          { label: 'Confirmed', value: 'CONFIRMED' },
          { label: 'In Production', value: 'IN_PRODUCTION' },
          { label: 'Ready', value: 'READY' },
          { label: 'Dispatched', value: 'DISPATCHED' },
          { label: 'Delivered', value: 'DELIVERED' },
          { label: 'Cancelled', value: 'CANCELLED' },
          { label: 'Returned', value: 'RETURNED' },
        ]}
        enableInlineEdit={true}
        onBatchSave={handleBatchSave}
      />

      {/* Create Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{isEdit ? 'Edit Sales Order' : 'Create Sales Order'}</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Select Customer *</label>
                  <SearchableSelect
                    required
                    value={customerId}
                    onChange={(val) => setCustomerId(val)}
                    placeholder="-- Choose Customer --"
                    options={customers.map(c => ({ value: c.id, label: `${c.name} (${c.type})` }))}
                  />
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

              {/* Order Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Product Type</label>
                  <input
                    type="text"
                    required
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Quantity (KG)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={items[0].quantity}
                    onChange={(e) => {
                      if (e.target.value !== '' && !/^\d*\.?\d*$/.test(e.target.value)) return;
                      const newItems = [...items];
                      newItems[0].quantity = e.target.value === '' ? '' : Number(e.target.value);
                      setItems(newItems);
                    }}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Unit Production Cost (₹)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editFormData.productionCost}
                    onChange={(e) => {
                      if (e.target.value !== '' && !/^\d*\.?\d*$/.test(e.target.value)) return;
                      setEditFormData({ ...editFormData, productionCost: e.target.value });
                    }}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Unit Selling Price (₹)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={items[0].unitPrice}
                    onChange={(e) => {
                      if (e.target.value !== '' && !/^\d*\.?\d*$/.test(e.target.value)) return;
                      const newItems = [...items];
                      newItems[0].unitPrice = e.target.value === '' ? '' : Number(e.target.value);
                      setItems(newItems);
                    }}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Total Selling Amount (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={editFormData.totalAmount}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm bg-gray-50 text-gray-900 font-semibold dark:border-gray-800 dark:bg-gray-900 dark:text-white cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Auto-calculated: Qty × Unit Price</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Margin % & Amount</label>
                  <input
                    type="text"
                    readOnly
                    value={editFormData.margin}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
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
                        type="text"
                        inputMode="numeric"
                        value={editFormData.outstanding}
                        onChange={(e) => {
                          if (e.target.value !== '' && !/^\d*\.?\d*$/.test(e.target.value)) {
                            toast.error('Only numbers are allowed for Outstanding Credit');
                            return;
                          }
                          setEditFormData({ ...editFormData, outstanding: e.target.value === '' ? 0 : Number(e.target.value) });
                        }}
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
