import React, { useEffect, useState, useCallback } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DataTable, Column } from '../../../components/DataTable';
import { getCachedData, setCachedData } from '../../../lib/cache';
import SkeletonList from '../../../components/SkeletonList';
import SearchableDropdown from '../../../components/SearchableDropdown';
import FilterPanel from '../../../components/FilterPanel';
import ActiveFilters from '../../../components/ActiveFilters';
import { useFilterStore } from '../../../store/filterStore';
import DatePickerField from '../../../components/DatePicker';
import { formatDate } from '../../../lib/utils';

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  deliveryDate?: string;
  status: string;
  totalAmount: number;
  outstanding: number;
  notes: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
  };
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
  }>;
}

const PAYMENT_METHODS = [
  { label: 'Credit (On Account)', value: 'CREDIT' },
  { label: 'Cash', value: 'CASH' },
  { label: 'UPI / GPay', value: 'UPI' },
  { label: 'Bank Transfer', value: 'BANK_TRANSFER' }
];

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'RETURNED'];

export default function SalesScreen() {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  const [orders, setOrders] = useState<Order[]>(getCachedData('sales') || []);
  const [invoices, setInvoices] = useState<any[]>(getCachedData('sales_invoices') || []);
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices'>('orders');
  
  const [customers, setCustomers] = useState<any[]>(getCachedData('sales_customers') || []);
  const [products, setProducts] = useState<any[]>(getCachedData('sales_products') || []);
  const [batches, setBatches] = useState<any[]>(getCachedData('sales_batches') || []);
  
  const [loading, setLoading] = useState(!getCachedData('sales'));
  const [isInteracting, setIsInteracting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  
  const [search, setSearch] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const filterState = useFilterStore(state => state.filters['sales']);
  const filters = filterState || {};

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [isInvoicePreviewVisible, setIsInvoicePreviewVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isInvoiceEditMode, setIsInvoiceEditMode] = useState(false);
  const [editableInvoice, setEditableInvoice] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT');
  
  const [formData, setFormData] = useState({
    type: '',
    quantity: '',
    productionCost: '',
    sellingCost: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    status: 'PENDING',
    outstanding: '',
    creditNotes: '',
    batchUsed: '',
  });

  // --- INVOICE PRINT & EXPORT ---
  const handleExportInvoice = async () => {
    if (!editableInvoice) return;
    try {
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
              body { 
                font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; 
                padding: 30px; 
                color: #111827; 
                background: #fff;
              }
              .border-box { border: 1px solid #D1D5DB; border-radius: 12px; padding: 24px; }
              
              /* Header */
              .header-flex { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #D1D5DB; padding-bottom: 16px; margin-bottom: 24px; }
              .header-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
              .logo-box { width: 32px; height: 32px; border-radius: 8px; background-color: #2563EB; display: flex; align-items: center; justify-content: center; }
              .logo-box svg { color: white; width: 20px; height: 20px; }
              .company-name { font-size: 24px; font-weight: 900; color: #1E3A8A; letter-spacing: -0.5px; margin: 0; }
              .company-subtitle { font-size: 12px; font-weight: 500; color: #4B5563; margin: 0 0 4px 0; }
              .company-address { font-size: 12px; color: #6B7280; margin: 0 0 2px 0; }
              .company-gst { font-size: 12px; font-weight: 700; color: #1E40AF; margin: 4px 0 0 0; }
              
              .invoice-badge-container { text-align: right; }
              .invoice-badge { display: inline-block; border: 2px solid #1E3A8A; background-color: #EFF6FF; color: #1E3A8A; font-weight: 700; font-size: 12px; text-transform: uppercase; padding: 4px 12px; border-radius: 6px; letter-spacing: 1px; margin-bottom: 12px; }
              .invoice-meta-row { display: flex; justify-content: flex-end; font-size: 12px; margin-bottom: 4px; }
              .meta-label { font-weight: 700; color: #374151; margin-right: 4px; }
              .meta-value-bold { font-family: monospace; font-weight: 700; color: #1E3A8A; }
              
              /* Bill To */
              .bill-to-grid { display: flex; gap: 24px; background-color: #F8FAFC; padding: 16px; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 24px; }
              .bill-to-col { flex: 1; }
              .bill-to-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748B; margin: 0 0 6px 0; }
              .customer-name { font-weight: 700; color: #111827; font-size: 16px; margin: 0 0 4px 0; }
              .customer-details { font-size: 12px; color: #4B5563; margin: 0 0 2px 0; }
              .customer-gst-label { font-size: 12px; font-weight: 700; color: #111827; margin: 0 0 2px 0; }
              
              /* Table */
              table { width: 100%; text-align: left; font-size: 12px; border-collapse: collapse; border: 1px solid #D1D5DB; margin-bottom: 24px; }
              thead { background-color: #F1F5F9; text-transform: uppercase; font-weight: 700; color: #374151; border-bottom: 1px solid #D1D5DB; }
              th { padding: 8px; border-right: 1px solid #D1D5DB; }
              th:last-child { border-right: none; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              
              tbody tr { border-bottom: 1px solid #E5E7EB; }
              tbody tr:last-child { border-bottom: none; }
              td { padding: 8px; border-right: 1px solid #D1D5DB; }
              td:last-child { border-right: none; }
              .col-idx { text-align: center; font-weight: 700; }
              .col-item { font-weight: 600; }
              .col-hsn { text-align: center; font-family: monospace; }
              .col-qty { text-align: right; font-weight: 700; }
              .col-rate { text-align: right; }
              .col-taxable { text-align: right; font-weight: 500; }
              .col-tax { text-align: right; color: #4B5563; }
              .col-total { text-align: right; font-weight: 700; color: #111827; }
              
              /* Bottom Section */
              .bottom-flex { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 8px; }
              .bank-container { max-width: 400px; }
              .bank-box { background-color: rgba(239, 246, 255, 0.6); padding: 12px; border-radius: 8px; border: 1px solid #DBEAFE; font-size: 12px; margin-bottom: 8px; }
              .bank-title { font-weight: 700; color: #1E3A8A; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px 0; }
              .bank-text { margin: 0 0 4px 0; }
              .bank-bold { font-weight: 600; }
              .terms { font-size: 11px; color: #6B7280; font-style: italic; margin: 0; line-height: 1.4; }
              
              .totals-box { width: 250px; font-size: 12px; border: 1px solid #D1D5DB; border-radius: 8px; padding: 12px; background-color: #F8FAFC; }
              .totals-row { display: flex; justify-content: space-between; color: #4B5563; margin-bottom: 4px; }
              .totals-row-val { font-weight: 600; }
              .grand-total-row { display: flex; justify-content: space-between; border-top: 1px solid #D1D5DB; padding-top: 8px; margin-top: 4px; font-size: 14px; font-weight: 700; color: #111827; align-items: center; }
              .grand-total-val { color: #1E3A8A; font-size: 16px; }
              
              /* Footer Signatures */
              .footer-flex { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #D1D5DB; padding-top: 32px; margin-top: 32px; }
              .sig-block { text-align: left; font-size: 12px; color: #6B7280; }
              .sig-block-right { text-align: right; font-size: 12px; }
              .sig-title { font-weight: 700; color: #111827; margin: 0; }
              .sig-line { height: 40px; border-bottom: 1px dashed #9CA3AF; width: 160px; margin-top: 8px; }
              .sig-line-right { height: 40px; border-bottom: 1px dashed #9CA3AF; width: 192px; margin-top: 8px; margin-left: auto; }
              .sig-sub { margin: 4px 0 0 0; color: #6B7280; font-size: 11px; }
            </style>
          </head>
          <body>
            <div class="border-box">
              <!-- Header -->
              <div class="header-flex">
                <div>
                  <div class="header-title-row">
                    <div class="logo-box">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                    </div>
                    <h2 class="company-name">LAKSHMI CANDLES</h2>
                  </div>
                  <p class="company-subtitle">Candle Manufacturing & Wholesale Distribution</p>
                  <p class="company-address">124 Industrial Estate, Guindy, Chennai, Tamil Nadu - 600032</p>
                  <p class="company-address">Phone: +91 98765 43210 | Email: billing@lakshmicandles.com</p>
                  <p class="company-gst">GSTIN: 33AABCT0000A1ZA | State Code: 33 (Tamil Nadu)</p>
                </div>
                
                <div class="invoice-badge-container">
                  <span class="invoice-badge">TAX INVOICE</span>
                  <div class="invoice-meta-row">
                    <span class="meta-label">Invoice No:</span> <span class="meta-value-bold">${editableInvoice.invoiceNumber || ''}</span>
                  </div>
                  <div class="invoice-meta-row">
                    <span class="meta-label">Invoice Date:</span> <span>${new Date(editableInvoice.invoiceDate || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div class="invoice-meta-row">
                    <span class="meta-label">Sales Order Ref:</span> <span>${editableInvoice.orderNumber || ''}</span>
                  </div>
                </div>
              </div>

              <!-- Bill To -->
              <div class="bill-to-grid">
                <div class="bill-to-col">
                  <h4 class="bill-to-title">BUYER / BILL TO:</h4>
                  <p class="customer-name">${editableInvoice.customerName || ''}</p>
                  <p class="customer-details">${editableInvoice.customerAddress || ''}</p>
                  <p class="customer-details">Phone: ${editableInvoice.customerPhone || ''}</p>
                </div>
                <div class="bill-to-col" style="text-align: right;">
                  <h4 class="bill-to-title">TAX DETAILS:</h4>
                  <p class="customer-gst-label">GSTIN: <span style="font-weight: 400;">${editableInvoice.customerGst || 'Unregistered / Retail'}</span></p>
                  <p class="customer-details">Place of Supply: Tamil Nadu (State Code 33)</p>
                  <p class="customer-details">Reverse Charge: No</p>
                </div>
              </div>

              <!-- Items Table -->
              <table>
                <thead>
                  <tr>
                    <th class="text-center">#</th>
                    <th>Item Description</th>
                    <th class="text-center">HSN</th>
                    <th class="text-right">Qty</th>
                    <th class="text-right">Rate (₹)</th>
                    <th class="text-right">Taxable (₹)</th>
                    <th class="text-right">CGST (9%)</th>
                    <th class="text-right">SGST (9%)</th>
                    <th class="text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  ${(editableInvoice.items || []).map((item: any, idx: number) => `
                    <tr>
                      <td class="col-idx">${idx + 1}</td>
                      <td class="col-item">${item.name || ''}</td>
                      <td class="col-hsn">${item.hsn || ''}</td>
                      <td class="col-qty">${item.qty || 0}</td>
                      <td class="col-rate">${item.price || 0}</td>
                      <td class="col-taxable">${(Number(item.qty) * Number(item.price)).toFixed(2)}</td>
                      <td class="col-tax">${(Number(item.qty) * Number(item.price) * 0.09).toFixed(2)}</td>
                      <td class="col-tax">${(Number(item.qty) * Number(item.price) * 0.09).toFixed(2)}</td>
                      <td class="col-total">${item.total || 0}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- Totals -->
              <div class="bottom-flex">
                <div class="bank-container">
                  <div class="bank-box">
                    <h4 class="bank-title">BANK PAYMENT DETAILS:</h4>
                    <p class="bank-text"><span class="bank-bold">Bank Name:</span> HDFC Bank Ltd</p>
                    <p class="bank-text"><span class="bank-bold">Account Name:</span> LAKSHMI CANDLES</p>
                    <p class="bank-text"><span class="bank-bold">Account No:</span> 50200012345678</p>
                    <p class="bank-text"><span class="bank-bold">IFSC Code:</span> HDFC0000123 (Guindy Branch)</p>
                  </div>
                  <p class="terms">
                    Terms & Conditions: Goods once sold will not be taken back. Interest @ 18% p.a. will be charged if payment is delayed beyond due date. Subject to Chennai Jurisdiction.
                  </p>
                </div>

                <div class="totals-box">
                  <div class="totals-row">
                    <span>Taxable Amount:</span>
                    <span class="totals-row-val">₹${editableInvoice.taxableAmount?.toLocaleString('en-IN') || 0}</span>
                  </div>
                  <div class="totals-row">
                    <span>CGST (9%):</span>
                    <span>₹${editableInvoice.cgstTotal?.toLocaleString('en-IN') || 0}</span>
                  </div>
                  <div class="totals-row">
                    <span>SGST (9%):</span>
                    <span>₹${editableInvoice.sgstTotal?.toLocaleString('en-IN') || 0}</span>
                  </div>
                  <div class="grand-total-row">
                    <span>GRAND TOTAL:</span>
                    <span class="grand-total-val">₹${editableInvoice.totalAmount?.toLocaleString('en-IN') || 0}</span>
                  </div>
                </div>
              </div>
              
              <!-- Footer / Signatory -->
              <div class="footer-flex">
                <div class="sig-block">
                  <p style="margin: 0;">Customer Signature</p>
                  <div class="sig-line"></div>
                </div>
                <div class="sig-block-right">
                  <p class="sig-title">For LAKSHMI CANDLES</p>
                  <div class="sig-line-right"></div>
                  <p class="sig-sub">Authorized Signatory</p>
                </div>
              </div>

            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert('Export Error', 'Failed to generate PDF.');
    }
  };

  const updateEditableInvoice = (field: string, value: string) => {
    setEditableInvoice((prev: any) => ({ ...prev, [field]: value }));
  };

  const updateEditableItem = (idx: number, field: string, value: string) => {
    setEditableInvoice((prev: any) => {
      const newItems = [...(prev.items || [])];
      newItems[idx] = { ...newItems[idx], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const EditableText = ({ isEdit, value, onChangeText, style, placeholder }: any) => {
    if (isEdit) {
      return (
        <TextInput 
          value={value?.toString() || ''} 
          onChangeText={onChangeText} 
          style={[style, { borderBottomWidth: 1, borderBottomColor: colors.textSecondary, paddingVertical: 2, paddingHorizontal: 4, backgroundColor: colors.text, borderRadius: 4, minWidth: 60 }]} 
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
        />
      );
    }
    return <Text style={style}>{value}</Text>;
  };

  const fetchData = async () => {
    try {
      const queryParams = new URLSearchParams({ limit: '500' });
      if (search) queryParams.append('search', search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const [salesRes, custRes, prodRes, batchRes, invRes] = await Promise.all([
        api.get(`/sales?${queryParams.toString()}`),
        api.get('/customers?limit=500'),
        api.get('/inventory?limit=500'),
        api.get('/production/batches'),
        api.get(`/sales/invoices/list?limit=500${search ? `&search=${search}` : ''}`)
      ]);
      const ordersList = salesRes.data.data?.data || salesRes.data.data || [];
      setOrders(ordersList);
      setCachedData('sales', ordersList);
      
      const invData = invRes.data.data || invRes.data;
      const invoicesList = invData?.data || invData || [];
      setInvoices(Array.isArray(invoicesList) ? invoicesList : []);
      setCachedData('sales_invoices', Array.isArray(invoicesList) ? invoicesList : []);
      
      const customersList = custRes.data.data?.data || custRes.data.data || [];
      setCustomers(customersList);
      setCachedData('sales_customers', customersList);

      const productsList = prodRes.data.data?.data || prodRes.data.data || [];
      setProducts(productsList);
      setCachedData('sales_products', productsList);

      const batchesList = batchRes.data.data?.data || batchRes.data.data || [];
      setBatches(batchesList);
      setCachedData('sales_batches', batchesList);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsInteracting(false);
    }
  };


  useFocusEffect(useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsInteracting(false);
      fetchData();
    });
  }, []));

  const parseNotes = (notes: string) => {
    try {
      return JSON.parse(notes);
    } catch {
      return {};
    }
  };

  const calculateTotals = () => {
    const qty = Number(formData.quantity) || 0;
    const unitSellingPrice = Number(formData.sellingCost) || 0;
    const unitProdCost = Number(formData.productionCost) || 0;
    
    const totalSellingCost = qty * unitSellingPrice;
    const totalProdCost = qty * unitProdCost;
    
    let marginStr = '';
    if (totalSellingCost > 0 || totalProdCost > 0) {
      const marginAmt = totalSellingCost - totalProdCost;
      const marginPct = totalSellingCost > 0 ? ((marginAmt / totalSellingCost) * 100).toFixed(2) : '0';
      marginStr = `${marginPct}% (₹${marginAmt.toFixed(2)})`;
    }

    return { totalSellingCost, marginStr };
  };

  const handleOpenCreate = () => {
    setCustomerId(customers.length > 0 ? customers[0].id : '');
    setPaymentMethod('CREDIT');
    setFormData({
      type: '',
      quantity: '',
      productionCost: '',
      sellingCost: '350',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
      status: 'PENDING',
      outstanding: '0',
      creditNotes: '',
      batchUsed: '',
    });
    setIsEdit(false);
    setIsModalVisible(true);
  };

  const handleOpenEdit = (order: Order) => {
    const notesData = parseNotes(order.notes);
    
    setCustomerId(order.customerId || '');
    setPaymentMethod('CREDIT'); // Usually derived from another relation, default to CREDIT
    
    const qty = order.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
    const unitPrice = order.items?.[0]?.unitPrice || 0;

    setFormData({
      type: notesData.type || '',
      quantity: qty.toString(),
      productionCost: notesData.productionCost || '',
      sellingCost: notesData.sellingCost || unitPrice.toString(),
      orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : '',
      deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
      status: order.status || 'PENDING',
      outstanding: (order.outstanding || 0).toString(),
      creditNotes: notesData.creditNotes || '',
      batchUsed: notesData.batchUsed || '',
    });
    setEditId(order.id);
    setIsEdit(true);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!customerId) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    if (!formData.quantity || !formData.sellingCost) {
      Alert.alert('Error', 'Quantity and Selling Price are required');
      return;
    }
    
    setSaving(true);
    try {
      const { totalSellingCost, marginStr } = calculateTotals();
      
      const payloadNotes = {
        batchUsed: formData.batchUsed,
        type: formData.type,
        productionCost: formData.productionCost,
        sellingCost: formData.sellingCost,
        margin: marginStr,
        creditNotes: formData.creditNotes,
      };

      if (isEdit) {
        await api.put(`/sales/${editId}`, {
          orderDate: formData.orderDate,
          deliveryDate: formData.deliveryDate,
          status: formData.status,
          totalAmount: totalSellingCost,
          outstanding: Number(formData.outstanding) || 0,
          quantity: Number(formData.quantity) || 0,
          notes: payloadNotes
        });
        Alert.alert('Success', 'Sales order updated successfully');
      } else {
        // Logic for batches for new orders as in web
        let itemsToSend: any[] = [];
        const qty = Number(formData.quantity) || 0;
        const productId = products.length > 0 ? (products[0].product?.id || products[0].id) : '';

        const availableBatches = batches
          .filter((b: any) => (b.productId === productId || b.productId === null) && b.remainingQty > 0)
          .sort((a: any, b: any) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

        let remainingToFulfill = qty;

        for (const batch of availableBatches) {
          if (remainingToFulfill <= 0) break;
          const allocated = Math.min(remainingToFulfill, batch.remainingQty);
          itemsToSend.push({
            productId,
            unitPrice: Number(formData.sellingCost),
            gstRate: 18,
            batchId: batch.id,
            quantity: allocated,
          });
          remainingToFulfill -= allocated;
        }

        if (remainingToFulfill > 0) {
          itemsToSend.push({
            productId,
            unitPrice: Number(formData.sellingCost),
            gstRate: 18,
            batchId: undefined,
            quantity: remainingToFulfill,
          });
        }

        await api.post('/sales', {
          customerId,
          paymentMethod,
          items: itemsToSend.length > 0 ? itemsToSend : [{ productId, quantity: qty, unitPrice: Number(formData.sellingCost), gstRate: 18 }],
          orderDate: formData.orderDate,
          deliveryDate: formData.deliveryDate,
          status: formData.status,
          notes: payloadNotes
        });
        Alert.alert('Success', 'Sales order created successfully');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.response?.data?.errors?.detail || 'Failed to save sales order');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F59E0B';
      case 'CONFIRMED': return '#3B82F6';
      case 'DELIVERED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  const columns: Column[] = [
    { key: 'actions', title: 'Actions', width: 80, render: (item) => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(item)}>
            <Feather name="edit-2" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => {
            Alert.alert('Delete Order', `Are you sure you want to delete order ${item.orderNumber}?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                  await api.delete(`/sales/${item.id}`);
                  fetchData();
                } catch (err: any) {
                  Alert.alert('Error', err.response?.data?.message || 'Failed to delete order');
                }
              }},
            ]);
          }}>
            <Feather name="trash-2" size={14} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )
    },
    { key: 'customer', title: 'Customer', width: 140, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]} numberOfLines={1}>{item.customer?.name || 'Unknown'}</Text> },
    { key: 'orderDate', title: 'Order Date', width: 100, render: (item) => <Text style={styles.cellText}>{formatDate(item.orderDate)}</Text> },
    { key: 'quantity', title: 'Qty (KG)', width: 80, render: (item) => {
        const qty = item.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
        return <Text style={styles.cellText}>{qty.toFixed(2)}</Text>;
      }
    },
    { key: 'totalAmount', title: 'Total Amount', width: 120, render: (item) => <Text style={styles.cellText}>₹{item.totalAmount?.toLocaleString()}</Text> },
    { key: 'outstanding', title: 'Outstanding', width: 100, render: (item) => (
        <Text style={[styles.cellText, { color: item.outstanding > 0 ? '#EF4444' : colors.textSecondary, fontWeight: item.outstanding > 0 ? 'bold' : 'normal' }]}>
          ₹{item.outstanding?.toLocaleString()}
        </Text>
      )
    },
    { key: 'status', title: 'Status', width: 100, render: (item) => (
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      )
    },
    
  ];

  const invoiceColumns: Column[] = [
    { key: 'invoiceNumber', title: 'Invoice #', width: 140, render: (item) => (
      <TouchableOpacity onPress={() => { 
        setSelectedInvoice(item); 
        setEditableInvoice(JSON.parse(JSON.stringify(item))); 
        setIsInvoiceEditMode(false);
        setIsInvoicePreviewVisible(true); 
      }}>
        <Text style={[styles.cellText, {fontWeight: 'bold', color: '#2996A8', textDecorationLine: 'underline'}]}>{item.invoiceNumber}</Text>
      </TouchableOpacity>
    ) },
    { key: 'customer', title: 'Customer', width: 140, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]} numberOfLines={1}>{item.customerName || item.customer?.name || 'Unknown'}</Text> },
    { key: 'date', title: 'Date', width: 100, render: (item) => <Text style={styles.cellText}>{formatDate(item.invoiceDate)}</Text> },
    { key: 'taxable', title: 'Taxable Amt', width: 100, render: (item) => <Text style={styles.cellText}>₹{(item.taxableAmount || (item.totalAmount - (item.gstAmount || 0))).toLocaleString()}</Text> },
    { key: 'cgst', title: 'CGST', width: 80, render: (item) => <Text style={styles.cellText}>₹{(item.cgstTotal || ((item.gstAmount || 0) / 2)).toLocaleString()}</Text> },
    { key: 'sgst', title: 'SGST', width: 80, render: (item) => <Text style={styles.cellText}>₹{(item.sgstTotal || ((item.gstAmount || 0) / 2)).toLocaleString()}</Text> },
    { key: 'total', title: 'Total', width: 100, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold', color: '#10B981'}]}>₹{item.totalAmount?.toLocaleString()}</Text> },
    { key: 'actions', title: '', width: 60, render: (item) => (
      <TouchableOpacity 
        style={styles.actionBtn}
        onPress={() => {
          setSelectedInvoice(item);
          setIsInvoicePreviewVisible(true);
        }}
      >
        <Ionicons name="eye-outline" size={20} color="#2996A8" />
      </TouchableOpacity>
    ) },
  ];

  const { totalSellingCost, marginStr } = calculateTotals();

  // Removed loading early return

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Sales & Orders</Text>
            <Text style={styles.pageSubtitle}>Manage customer orders</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleOpenCreate}>
          <Text style={styles.newButtonText}>+ New Order</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput 
            style={styles.searchInput} 
            placeholder={activeTab === 'orders' ? "Search orders..." : "Search invoices..."}
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchData}
          />
        </View>
        <TouchableOpacity style={styles.actionIconBtn} onPress={() => setIsFilterVisible(true)}>
          <Feather name="filter" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ActiveFilters 
        module="sales"
        config={[
          { key: 'status', label: 'Order Status', type: 'select', options: ORDER_STATUSES.map(s => ({ label: s, value: s })) },
          { key: 'dateRange', label: 'Date', type: 'date-range' }
        ]}
        onFiltersChanged={fetchData}
      />

      <FilterPanel
        module="sales"
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={fetchData}
        config={[
          { key: 'status', label: 'Order Status', type: 'select', options: ORDER_STATUSES.map(s => ({ label: s, value: s })) },
          { key: 'dateRange', label: 'Date Range', type: 'date-range' }
        ]}
      />

      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 8, padding: 4 }}>
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: activeTab === 'orders' ? '#2996A8' : 'transparent' }}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={{ fontWeight: 'bold', color: activeTab === 'orders' ? colors.text : colors.textSecondary }}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6, backgroundColor: activeTab === 'invoices' ? '#2996A8' : 'transparent' }}
            onPress={() => setActiveTab('invoices')}
          >
            <Text style={{ fontWeight: 'bold', color: activeTab === 'invoices' ? colors.text : colors.textSecondary }}>GST Invoices</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tableWrapper}>
        {isInteracting || (loading && !refreshing) ? (
          <SkeletonList />
        ) : activeTab === 'orders' ? (
          <DataTable columns={columns} data={orders} showActions={false} />
        ) : (
          <DataTable columns={invoiceColumns} data={invoices} showActions={false} />
        )}
      </View>

      {/* INVOICE PREVIEW MODAL */}
      <Modal visible={isInvoicePreviewVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsInvoicePreviewVisible(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.text }]} edges={['top']}>
          <View style={[styles.modalHeader, { backgroundColor: colors.text, borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.modalTitle, { color: colors.background, fontSize: 16 }]}>Tax Invoice</Text>
              <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1D4ED8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                  {selectedInvoice?.invoiceNumber}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <TouchableOpacity onPress={() => setIsInvoiceEditMode(!isInvoiceEditMode)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isInvoiceEditMode ? '#DBEAFE' : colors.text, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Feather name={isInvoiceEditMode ? "check" : "edit-2"} size={12} color={isInvoiceEditMode ? "#1D4ED8" : colors.textSecondary} />
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: isInvoiceEditMode ? "#1D4ED8" : colors.textSecondary }}>{isInvoiceEditMode ? 'Done' : 'Edit'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleExportInvoice} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2563EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Feather name="printer" size={12} color={colors.text} />
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.text }}>Print / PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsInvoicePreviewVisible(false)} style={{ padding: 2 }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {selectedInvoice && (
              <View style={{ backgroundColor: colors.text, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                
                {/* Header Section */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 16, marginBottom: 16 }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' }}>
                         <Feather name="bar-chart-2" size={14} color="#FFF" />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#1E3A8A' }}>LAKSHMI CANDLES</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 2 }}>124 Industrial Estate, Guindy, Chennai</Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 4 }}>Tamil Nadu - 600032 | +91 9876543210</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1E40AF' }}>GSTIN: 33AABCT0000A1ZA</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ borderWidth: 1, borderColor: '#1E3A8A', backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1E3A8A' }}>TAX INVOICE</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginBottom: 2 }}>Date: {formatDate(selectedInvoice.invoiceDate)}</Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>Order Ref: {selectedInvoice.orderNumber}</Text>
                  </View>
                </View>

                {/* Buyer Details */}
                <View style={{ backgroundColor: colors.text, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, marginBottom: 16, flexDirection: 'row' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 4 }}>BILL TO:</Text>
                    <EditableText isEdit={isInvoiceEditMode} value={editableInvoice?.customerName} onChangeText={(t: string) => updateEditableInvoice('customerName', t)} style={{ fontSize: 14, fontWeight: 'bold', color: colors.background, marginBottom: 2 }} placeholder="Customer Name" />
                    {(editableInvoice?.customerAddress || isInvoiceEditMode) ? <EditableText isEdit={isInvoiceEditMode} value={editableInvoice?.customerAddress} onChangeText={(t: string) => updateEditableInvoice('customerAddress', t)} style={{ fontSize: 11, color: colors.textSecondary }} placeholder="Address" /> : null}
                    {(editableInvoice?.customerPhone || isInvoiceEditMode) ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        {!isInvoiceEditMode && <Text style={{ fontSize: 11, color: colors.textSecondary }}>Phone: </Text>}
                        <EditableText isEdit={isInvoiceEditMode} value={editableInvoice?.customerPhone} onChangeText={(t: string) => updateEditableInvoice('customerPhone', t)} style={{ fontSize: 11, color: colors.textSecondary }} placeholder="Phone" />
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 4 }}>TAX DETAILS:</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {!isInvoiceEditMode && <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.background }}>GSTIN: </Text>}
                      <EditableText isEdit={isInvoiceEditMode} value={editableInvoice?.customerGst} onChangeText={(t: string) => updateEditableInvoice('customerGst', t)} style={{ fontSize: 11, fontWeight: 'bold', color: colors.background }} placeholder="GSTIN" />
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>State: 33 (Tamil Nadu)</Text>
                  </View>
                </View>

                {/* Items Table */}
                <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', backgroundColor: colors.text, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 8, paddingHorizontal: 8 }}>
                    <Text style={{ flex: 2, fontSize: 10, fontWeight: 'bold', color: colors.textSecondary }}>ITEM</Text>
                    <Text style={{ flex: 1, fontSize: 10, fontWeight: 'bold', color: colors.textSecondary, textAlign: 'center' }}>QTY</Text>
                    <Text style={{ flex: 1.5, fontSize: 10, fontWeight: 'bold', color: colors.textSecondary, textAlign: 'right' }}>RATE</Text>
                    <Text style={{ flex: 1.5, fontSize: 10, fontWeight: 'bold', color: colors.textSecondary, textAlign: 'right' }}>TOTAL</Text>
                  </View>
                  
                  {editableInvoice?.items?.map((item: any, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row', borderBottomWidth: idx === editableInvoice.items.length - 1 ? 0 : 1, borderBottomColor: colors.border, paddingVertical: 8, paddingHorizontal: 8 }}>
                      <View style={{ flex: 2 }}>
                        <EditableText isEdit={isInvoiceEditMode} value={item.name} onChangeText={(t: string) => updateEditableItem(idx, 'name', t)} style={{ fontSize: 11, fontWeight: 'bold', color: colors.background }} placeholder="Item Name" />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          {!isInvoiceEditMode && <Text style={{ fontSize: 9, color: colors.textSecondary }}>HSN: </Text>}
                          <EditableText isEdit={isInvoiceEditMode} value={item.hsn} onChangeText={(t: string) => updateEditableItem(idx, 'hsn', t)} style={{ fontSize: 9, color: colors.textSecondary }} placeholder="HSN Code" />
                        </View>
                      </View>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <EditableText isEdit={isInvoiceEditMode} value={item.qty} onChangeText={(t: string) => updateEditableItem(idx, 'qty', t)} style={{ fontSize: 11, color: colors.background, textAlign: 'center' }} placeholder="Qty" />
                      </View>
                      <View style={{ flex: 1.5, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end' }}>
                        {!isInvoiceEditMode && <Text style={{ fontSize: 11, color: colors.background }}>₹</Text>}
                        <EditableText isEdit={isInvoiceEditMode} value={item.price} onChangeText={(t: string) => updateEditableItem(idx, 'price', t)} style={{ fontSize: 11, color: colors.background, textAlign: 'right' }} placeholder="Rate" />
                      </View>
                      <View style={{ flex: 1.5, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end' }}>
                        {!isInvoiceEditMode && <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.background }}>₹</Text>}
                        <EditableText isEdit={isInvoiceEditMode} value={item.total} onChangeText={(t: string) => updateEditableItem(idx, 'total', t)} style={{ fontSize: 11, fontWeight: 'bold', color: colors.background, textAlign: 'right' }} placeholder="Total" />
                      </View>
                    </View>
                  ))}
                  
                  {(!editableInvoice?.items || editableInvoice.items.length === 0) && (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>No items found.</Text>
                    </View>
                  )}
                </View>

                {/* Bank & Totals */}
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={{ flex: 1.2, backgroundColor: '#EFF6FF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 4 }}>BANK PAYMENT DETAILS</Text>
                    <Text style={{ fontSize: 10, color: '#1E40AF', fontWeight: 'bold' }}>HDFC Bank Ltd</Text>
                    <Text style={{ fontSize: 9, color: '#1E40AF', marginTop: 2 }}>A/c: 50200012345678</Text>
                    <Text style={{ fontSize: 9, color: '#1E40AF' }}>IFSC: HDFC0000123</Text>
                  </View>
                  
                  <View style={{ flex: 1, backgroundColor: colors.text, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>Taxable Amt:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {!isInvoiceEditMode && <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.background }}>₹</Text>}
                        <EditableText isEdit={isInvoiceEditMode} value={editableInvoice?.taxableAmount} onChangeText={(t: string) => updateEditableInvoice('taxableAmount', t)} style={{ fontSize: 10, fontWeight: 'bold', color: colors.background, textAlign: 'right' }} placeholder="0" />
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>CGST (9%):</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {!isInvoiceEditMode && <Text style={{ fontSize: 10, color: colors.background }}>₹</Text>}
                        <EditableText isEdit={isInvoiceEditMode} value={editableInvoice?.cgstTotal} onChangeText={(t: string) => updateEditableInvoice('cgstTotal', t)} style={{ fontSize: 10, color: colors.background, textAlign: 'right' }} placeholder="0" />
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 6 }}>
                      <Text style={{ fontSize: 10, color: colors.textSecondary }}>SGST (9%):</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {!isInvoiceEditMode && <Text style={{ fontSize: 10, color: colors.background }}>₹</Text>}
                        <EditableText isEdit={isInvoiceEditMode} value={editableInvoice?.sgstTotal} onChangeText={(t: string) => updateEditableInvoice('sgstTotal', t)} style={{ fontSize: 10, color: colors.background, textAlign: 'right' }} placeholder="0" />
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.background }}>TOTAL:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {!isInvoiceEditMode && <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#2563EB' }}>₹</Text>}
                        <EditableText isEdit={isInvoiceEditMode} value={editableInvoice?.totalAmount} onChangeText={(t: string) => updateEditableInvoice('totalAmount', t)} style={{ fontSize: 12, fontWeight: 'bold', color: '#2563EB', textAlign: 'right' }} placeholder="0" />
                      </View>
                    </View>
                  </View>
                </View>

              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* CREATE / EDIT MODAL */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? 'Edit Sales Order' : 'Create Sales Order'}</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Select Customer *</Text>
                <SearchableDropdown
                  data={customers}
                  value={customerId}
                  onSelect={setCustomerId}
                  labelExtractor={(c) => c.type ? `${c.name} (${c.type})` : c.name}
                  placeholder="Select Customer"
                  searchPlaceholder="Search customers by name..."
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                {!isEdit && (
                  <>
                    <Text style={styles.label}>Payment Terms</Text>
                    <SearchableDropdown
                      data={PAYMENT_METHODS}
                      value={paymentMethod}
                      onSelect={setPaymentMethod}
                      keyExtractor={(item) => item.value}
                      labelExtractor={(item) => item.label}
                      placeholder="Select Terms"
                    />
                  </>
                )}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Product Type</Text>
                <TextInput style={styles.input} value={formData.type} onChangeText={(t) => setFormData({...formData, type: t})} placeholder="e.g. Spiral Candles" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Quantity (KG) *</Text>
                <TextInput style={styles.input} value={formData.quantity} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, quantity: t})} placeholder="10" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Unit Production Cost (₹)</Text>
                <TextInput style={styles.input} value={formData.productionCost} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, productionCost: t})} placeholder="Optional" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Unit Selling Price (₹) *</Text>
                <TextInput style={styles.input} value={formData.sellingCost} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, sellingCost: t})} placeholder="350" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Total Selling Amount (₹)</Text>
                <TextInput style={[styles.input, { opacity: 0.8 }]} value={totalSellingCost ? totalSellingCost.toString() : '0'} editable={false} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Margin % & Amount</Text>
                <TextInput style={[styles.input, { opacity: 0.8, color: '#10B981' }]} value={marginStr || '-'} editable={false} />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <DatePickerField
                  label="Order Date *"
                  value={formData.orderDate}
                  onChange={(d) => setFormData({...formData, orderDate: d})}
                  placeholder="Select order date"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <DatePickerField
                  label="Delivery Date"
                  value={formData.deliveryDate}
                  onChange={(d) => setFormData({...formData, deliveryDate: d})}
                  placeholder="Select delivery date"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Status</Text>
                <SearchableDropdown
                  data={ORDER_STATUSES}
                  value={formData.status}
                  onSelect={(s) => setFormData({...formData, status: s})}
                  keyExtractor={(item) => item as string}
                  labelExtractor={(item) => (item as string).replace('_', ' ')}
                  placeholder="Select status"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Outstanding Credit (₹)</Text>
                <TextInput style={styles.input} value={formData.outstanding} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, outstanding: t})} placeholder="0" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Credit Notes</Text>
              <TextInput style={styles.input} value={formData.creditNotes} onChangeText={(t) => setFormData({...formData, creditNotes: t})} placeholder="e.g. Will pay next Friday" placeholderTextColor={colors.textSecondary} />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Submit Order'}</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4, marginLeft: -4 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  newButton: { backgroundColor: '#2996A8', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  newButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  actionBar: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 12, height: 36, gap: 8 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, height: '100%' },
  actionIconBtn: { width: 36, height: 36, backgroundColor: colors.surface, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tableWrapper: { flex: 1, paddingHorizontal: 16, paddingBottom: 80 },
  cellText: { color: colors.text, fontSize: 14 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  actionBtn: { padding: 8 },
  
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.surface, backgroundColor: colors.background },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 16, marginBottom: 0 },
  label: { fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  pillContainer: { flexDirection: 'row' },
  pill: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: '#2996A8', borderColor: '#2996A8' },
  pillText: { color: colors.textSecondary, fontSize: 14, fontWeight: 'bold' },
  pillTextActive: { color: '#fff' },
  divider: { height: 1, backgroundColor: colors.surface, marginVertical: 20 },
  
  previewBox: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginTop: 4, borderWidth: 1, borderColor: colors.border },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  previewLabel: { color: colors.textSecondary, fontSize: 14 },
  previewValue: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: colors.surface, backgroundColor: colors.background, gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center' },
  cancelBtnText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#2563EB', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
