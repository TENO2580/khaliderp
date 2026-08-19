'use client';

import React, { useEffect, useState } from 'react';
import DataTable, { Column } from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, FileText, CheckCircle2, DollarSign, X, Upload, History, FileSpreadsheet, Printer } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import OrderImportModal from '@/components/shared/import/OrderImportModal';
import ImportHistoryModal from '@/components/shared/import/ImportHistoryModal';
import InvoiceModal from '@/components/shared/InvoiceModal';

const fetcher = (url: string) => api.get(url).then(res => res.data.data);

export default function DesktopSales() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (urlSearch !== null) {
      setSearch(urlSearch);
    }
  }, [urlSearch]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create/Edit Order Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any>(null);
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
    productId: '',
    weightPerUnit: 0,
    totalWeightKg: 0,
    productionCostPerKg: 0,
    profitAmt: 0,
    mrp: 0,
    regionalPrice: 0,
    productionCost: '',
    sellingCost: '',
    margin: '',
    totalAmount: 0,
    status: 'PENDING',
    outstanding: 0,
    creditNotes: '',
  });

  const { data: salesRes, mutate: mutateSales, isLoading: isSalesLoading } = useSWR(
    `/sales?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`,
    fetcher
  );
  const { data: customersRes } = useSWR('/customers?limit=100', fetcher);
  const { data: productsRes } = useSWR('/products?limit=100', fetcher);
  const { data: batchesRes } = useSWR('/production/batches', fetcher);

  const orders = salesRes?.data || [];
  const totalPages = salesRes?.pagination?.totalPages || 1;
  const totalItems = salesRes?.pagination?.total || 0;
  
  const customers = customersRes?.data || [];
  const products = productsRes?.products || [];
  const batches = batchesRes?.data || (Array.isArray(batchesRes) ? batchesRes : []);

  const isLoading = isSalesLoading;

  const fetchData = () => {
    mutateSales();
  };

  // FIFO Batch Calculation (just for batch tracking)
  useEffect(() => {
    if (!isEdit && batches.length > 0 && items[0].productId) {
      const qty = Number(items[0].quantity) || 0;
      
      const availableBatches = batches
        .filter((b: any) => (b.productId === items[0].productId || b.productId === null) && b.remainingQty > 0)
        .sort((a: any, b: any) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

      let remainingToFulfill = qty;
      let usedBatchNumbers: string[] = [];

      for (const batch of availableBatches) {
        if (remainingToFulfill <= 0) break;
        const allocated = Math.min(remainingToFulfill, batch.remainingQty);
        usedBatchNumbers.push(batch.batchNumber);
        remainingToFulfill -= allocated;
      }
      
      const selectedProduct = products.find((p: any) => (p.product?.id || p.id) === items[0].productId);
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
    const prodCostPerKg = Number(editFormData.productionCostPerKg) || 0;
    const weightPerUnit = Number(editFormData.weightPerUnit) || 0;
    
    const totalWeightKg = qty * weightPerUnit;
    const totalSellingCost = qty * unitSellingPrice;
    const totalProdCost = totalWeightKg * prodCostPerKg;
    
    setEditFormData(prev => {
      let marginStr = '';
      let profitAmt = 0;
      
      if (totalSellingCost > 0 || totalProdCost > 0) {
        profitAmt = totalSellingCost - totalProdCost;
        const marginPct = totalSellingCost > 0 ? ((profitAmt / totalSellingCost) * 100).toFixed(2) : '0';
        marginStr = `${marginPct}% (₹${profitAmt.toFixed(2)})`;
      }

      if (
        prev.totalAmount !== totalSellingCost || 
        prev.margin !== marginStr ||
        prev.totalWeightKg !== totalWeightKg ||
        prev.productionCost !== totalProdCost.toFixed(2) ||
        prev.sellingCost !== totalSellingCost.toFixed(2)
      ) {
        return {
          ...prev, 
          totalAmount: totalSellingCost,
          sellingCost: totalSellingCost.toFixed(2),
          productionCost: totalProdCost.toFixed(2),
          profitAmt: profitAmt,
          totalWeightKg: totalWeightKg,
          margin: marginStr
        };
      }
      return prev;
    });
  }, [items, editFormData.productionCostPerKg, editFormData.weightPerUnit]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a customer');
      return;
    }
    
    if (editFormData.deliveryDate && editFormData.orderDate) {
      if (new Date(editFormData.deliveryDate) < new Date(editFormData.orderDate)) {
        toast.error('Delivery date cannot be earlier than order date');
        return;
      }
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
            productId: editFormData.productId,
            type: editFormData.type,
            weightPerUnit: editFormData.weightPerUnit,
            quantityUnits: Number(items[0].quantity) || 0,
            totalWeightKg: editFormData.totalWeightKg,
            productionCostPerKg: editFormData.productionCostPerKg,
            productionCost: editFormData.productionCost,
            unitSellingPrice: items[0].unitPrice,
            sellingCost: editFormData.sellingCost,
            profitAmt: editFormData.profitAmt,
            margin: editFormData.margin,
            mrp: editFormData.mrp,
            regionalPrice: editFormData.regionalPrice,
            batchUsed: editFormData.batchUsed,
            creditNotes: editFormData.creditNotes,
          }
        });
        toast.success('Sales order updated successfully!');
      } else {
        let itemsToSend: any[] = [];
        const qty = Number(items[0].quantity) || 0;
        const availableBatches = batches
          .filter((b: any) => (b.productId === items[0].productId || b.productId === null) && b.remainingQty > 0)
          .sort((a: any, b: any) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

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
            productId: editFormData.productId,
            type: editFormData.type,
            weightPerUnit: editFormData.weightPerUnit,
            quantityUnits: qty,
            totalWeightKg: editFormData.totalWeightKg,
            productionCostPerKg: editFormData.productionCostPerKg,
            productionCost: editFormData.productionCost,
            unitSellingPrice: items[0].unitPrice,
            sellingCost: editFormData.sellingCost,
            profitAmt: editFormData.profitAmt,
            margin: editFormData.margin,
            mrp: editFormData.mrp,
            regionalPrice: editFormData.regionalPrice,
            batchUsed: editFormData.batchUsed,
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
      productId: data.productId || order.items?.[0]?.productId || '',
      weightPerUnit: data.weightPerUnit || 0,
      totalWeightKg: data.totalWeightKg || 0,
      productionCostPerKg: data.productionCostPerKg || 0,
      profitAmt: data.profitAmt || 0,
      mrp: data.mrp || 0,
      regionalPrice: data.regionalPrice || 0,
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sales order? Inventory will be reverted.')) return;
    try {
      await api.delete(`/sales/${id}`);
      toast.success('Sales order deleted successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
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
        const order = orders.find((o: any) => o.id === rowId);
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
            const newQty = Number(value) || 0;
            updateBody.quantity = newQty;
            
            const weightPerUnit = existingNotes.weightPerUnit || 0;
            const prodCostPerKg = existingNotes.productionCostPerKg || 0;
            const unitSelling = existingNotes.unitSellingPrice || (order.items?.[0]?.unitPrice || 0);

            if (weightPerUnit > 0) {
              const totalWeightKg = newQty * weightPerUnit;
              const totalProdCost = totalWeightKg * prodCostPerKg;
              const totalSellingCost = newQty * unitSelling;
              
              newNotes.totalWeightKg = totalWeightKg;
              newNotes.productionCost = totalProdCost.toFixed(2);
              newNotes.sellingCost = totalSellingCost.toFixed(2);
              updateBody.totalAmount = totalSellingCost;
              hasNotesChange = true;
            }
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
      cell: (o) => (
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          {o.fifoBatches || '-'}
        </span>
      ),
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
      header: 'Qty (Units)',
      editableKey: 'quantity',
      inlineEditable: true,
      inputType: 'number',
      cell: (o) => {
        const qty = o.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
        return <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{qty}</span>;
      },
    },
    {
      header: 'Quantity (KG)',
      cell: (o) => {
        const data = parseNotes(o.notes);
        return <span className="text-sm text-gray-900 dark:text-gray-100">{data.totalWeightKg ? data.totalWeightKg.toFixed(2) : '-'}</span>;
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
      header: 'Margin %',
      cell: (o) => {
        const data = parseNotes(o.notes);
        if (!data.margin) return <span className="text-sm text-gray-900 dark:text-gray-100">-</span>;
        const parts = data.margin.split(' (');
        return <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{parts[0]}</span>;
      },
    },
    {
      header: 'Margin Amount',
      cell: (o) => {
        const data = parseNotes(o.notes);
        if (!data.margin) return <span className="text-sm text-gray-900 dark:text-gray-100">-</span>;
        const parts = data.margin.split(' (');
        const amt = parts[1] ? parts[1].replace(')', '') : '-';
        return <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{amt}</span>;
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedInvoiceOrder(o);
              setIsInvoiceModalOpen(true);
            }}
            className="rounded-lg p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/50"
            title="View / Print Proforma Invoice"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEditClick(o)}
            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50"
            title="Edit Order"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </button>
          <button
            onClick={() => handleDelete(o.id)}
            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
            title="Delete Order"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales & Orders</h1>
          <p className="text-sm text-gray-500">Create orders, generate GST invoices, track receivables</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <History className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Import History</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Import Data</span>
          </button>
        </div>
      </div>

      <DataTable 
        totalItems={totalItems}
        limit={limit}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        columns={columns}
        data={orders}
        searchPlaceholder="Search by order, customer..."
        searchValue={search}
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
            productId: '',
            weightPerUnit: 0,
            totalWeightKg: 0,
            productionCostPerKg: 0,
            profitAmt: 0,
            mrp: 0,
            regionalPrice: 0,
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
                    options={customers.map((c: any) => ({ value: c.id, label: `${c.name} (${c.type})` }))}
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
                  <SearchableSelect
                    required
                    value={editFormData.productId}
                    onChange={(val) => {
                      const selectedProduct = products.find((p: any) => p.id === val);
                      if (!selectedProduct) return;
                      const weightPerUnit = selectedProduct.weightKg || 0;
                      const prodCostPerKg = selectedProduct.prodCostPerKg || (selectedProduct.totalProdCost / selectedProduct.weightKg) || 0;
                      
                      setItems([{ ...items[0], productId: val, unitPrice: selectedProduct.sellingPrice || 0 }]);
                      
                      setEditFormData({
                        ...editFormData,
                        productId: val,
                        type: selectedProduct.name,
                        weightPerUnit,
                        productionCostPerKg: prodCostPerKg,
                        mrp: selectedProduct.mrp || 0,
                        regionalPrice: selectedProduct.regionalPrice || 0,
                      });
                    }}
                    placeholder="-- Choose Product --"
                    options={products.map((p: any) => ({ value: p.id, label: p.name }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Quantity (Units)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={items[0].quantity}
                    onChange={(e) => {
                      if (e.target.value !== '' && !/^\d*\.?\d*$/.test(e.target.value)) return;
                      const newItems = [...items];
                      newItems[0].quantity = e.target.value === '' ? '' : (e.target.value === '' ? '' : Number(e.target.value)) as any;
                      setItems(newItems);
                    }}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Total Weight (KG)</label>
                  <input
                    type="text"
                    readOnly
                    value={editFormData.totalWeightKg ? editFormData.totalWeightKg.toFixed(2) : '0.00'}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm bg-gray-50 text-gray-900 font-semibold dark:border-gray-800 dark:bg-gray-900 dark:text-white cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Auto-calculated: Qty × {editFormData.weightPerUnit} KG/Unit</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Unit Production Cost (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={editFormData.productionCostPerKg ? editFormData.productionCostPerKg.toFixed(2) : '0.00'}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm bg-gray-50 text-gray-900 font-semibold dark:border-gray-800 dark:bg-gray-900 dark:text-white cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">From Product Pricing Engine</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Total Production Cost (₹)</label>
                  <input
                    type="text"
                    readOnly
                    value={editFormData.productionCost}
                    className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 text-sm bg-gray-50 text-gray-900 font-semibold dark:border-gray-800 dark:bg-gray-900 dark:text-white cursor-not-allowed"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Auto-calculated: {editFormData.totalWeightKg.toFixed(2)} KG × ₹{editFormData.productionCostPerKg.toFixed(2)}/KG</p>
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
                      newItems[0].unitPrice = e.target.value === '' ? '' : (e.target.value === '' ? '' : Number(e.target.value)) as any;
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
                    min={editFormData.orderDate}
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
                        <option 
                          value="DELIVERED" 
                          disabled={editFormData.deliveryDate ? editFormData.deliveryDate > new Date().toISOString().split('T')[0] : false}
                        >
                          {editFormData.deliveryDate && editFormData.deliveryDate > new Date().toISOString().split('T')[0] ? 'Delivered (Invalid: Future Date)' : 'Delivered'}
                        </option>
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
                          setEditFormData({ ...editFormData, outstanding: (e.target.value === '' ? '' : Number(e.target.value)) as any });
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

      {/* Order Import Modal */}
      <OrderImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          fetchData();
        }}
      />

      {/* Import History Modal */}
      <ImportHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Official Proforma / Tax Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoiceOrder(null);
        }}
        order={selectedInvoiceOrder}
      />
    </div>
  );
}
