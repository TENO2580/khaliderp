import React, { useEffect, useState, useCallback } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { DataTable, Column } from '../../../components/DataTable';
import { getCachedData, setCachedData } from '../../../lib/cache';
import SkeletonList from '../../../components/SkeletonList';
import FilterPanel from '../../../components/FilterPanel';
import ActiveFilters from '../../../components/ActiveFilters';
import { useFilterStore } from '../../../store/filterStore';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  material: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

const PURCHASE_STATUSES = ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'];

export default function PurchaseScreen() {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  const [orders, setOrders] = useState<PurchaseOrder[]>(getCachedData('purchase') || []);
  const [loading, setLoading] = useState(!getCachedData('purchase'));
  const [isInteracting, setIsInteracting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const filterState = useFilterStore(state => state.filters['purchase']);
  const filters = filterState || {};

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    supplierName: 'Wax Industries Pvt Ltd',
    material: 'Paraffin Wax',
    quantity: '500',
    unitPrice: '85',
  });

  const fetchData = async () => {
    try {
      const currentFilters = useFilterStore.getState().filters['purchase'] || {};

      const queryParams = new URLSearchParams({ limit: '50' });
      if (search) queryParams.append('search', search);
      if (currentFilters.status) queryParams.append('status', currentFilters.status);
      if (currentFilters.startDate) queryParams.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) queryParams.append('endDate', currentFilters.endDate);

      const res = await api.get(`/purchase?${queryParams.toString()}`);
      const data = res.data.data.data || res.data.data;
      setOrders(data);
      setCachedData('purchase', data);
    } catch (error) {
      console.error('Failed to fetch purchase orders', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsInteracting(false);
      fetchData();
    });
  }, []));

  const handleOpenCreate = () => {
    setFormData({
      supplierName: 'Wax Industries Pvt Ltd',
      material: 'Paraffin Wax',
      quantity: '500',
      unitPrice: '85',
    });
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.supplierName || !formData.material) {
      Alert.alert('Error', 'Supplier Name and Material are required');
      return;
    }
    
    setSaving(true);
    try {
      await api.post('/purchase', {
        supplierName: formData.supplierName,
        material: formData.material,
        quantity: Number(formData.quantity) || 0,
        unitPrice: Number(formData.unitPrice) || 0,
        gstNumber: '33AABCT1234A1ZA' // Default as in web
      });
      Alert.alert('Success', 'Purchase Order created successfully');
      setIsModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create PO');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return colors.textSecondary;
      case 'ORDERED': return '#3B82F6';
      case 'PARTIALLY_RECEIVED': return '#F59E0B';
      case 'RECEIVED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'UNPAID': return '#EF4444';
      case 'PARTIAL': return '#F59E0B';
      case 'PAID': return '#10B981';
      default: return colors.textSecondary;
    }
  };

  const columns: Column[] = [
    { key: 'poNumber', title: 'PO #', width: 90, render: (item) => <Text style={[styles.cellText, { color: colors.tint, fontWeight: 'bold' }]}>{item.poNumber}</Text> },
    { key: 'supplierName', title: 'Supplier', width: 140, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]} numberOfLines={1}>{item.supplierName}</Text> },
    { key: 'material', title: 'Material', width: 120, render: (item) => <Text style={styles.cellText} numberOfLines={1}>{item.material}</Text> },
    { key: 'totalAmount', title: 'Total Cost', width: 100, render: (item) => <Text style={styles.cellText}>₹{item.totalAmount?.toLocaleString()}</Text> },
    { key: 'status', title: 'Status', width: 100, render: (item) => (
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      )
    },
    { key: 'paymentStatus', title: 'Payment', width: 100, render: (item) => (
        <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(item.paymentStatus) + '20' }]}>
          <Text style={[styles.statusText, { color: getPaymentStatusColor(item.paymentStatus) }]}>{item.paymentStatus}</Text>
        </View>
      )
    }
  ];

  // Removed loading early return

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Purchase Orders</Text>
            <Text style={styles.pageSubtitle}>Manage procurement</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleOpenCreate}>
          <Text style={styles.newButtonText}>+ Create PO</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search PO # or supplier..." 
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
        module="purchase"
        config={[
          { key: 'status', label: 'Order Status', type: 'select', options: PURCHASE_STATUSES.map(s => ({ label: s, value: s })) },
          { key: 'dateRange', label: 'Date', type: 'date-range' }
        ]}
        onFiltersChanged={fetchData}
      />

      <FilterPanel
        module="purchase"
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={fetchData}
        config={[
          { key: 'status', label: 'Order Status', type: 'select', options: PURCHASE_STATUSES.map(s => ({ label: s, value: s })) },
          { key: 'dateRange', label: 'Date Range', type: 'date-range' }
        ]}
      />

      <View style={styles.tableWrapper}>
        {isInteracting || (loading && !refreshing && orders.length === 0) ? (
          <SkeletonList />
        ) : (
          <DataTable columns={columns} data={orders} showActions={false} />
        )}
      </View>

      {/* CREATE MODAL */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Purchase Order</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Supplier Name *</Text>
              <TextInput style={styles.input} value={formData.supplierName} onChangeText={(t) => setFormData({...formData, supplierName: t})} placeholder="Supplier Name" placeholderTextColor={colors.textSecondary} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Raw Material Item *</Text>
              <TextInput style={styles.input} value={formData.material} onChangeText={(t) => setFormData({...formData, material: t})} placeholder="e.g. Paraffin Wax" placeholderTextColor={colors.textSecondary} />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput style={styles.input} value={formData.quantity} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, quantity: t})} placeholder="500" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Unit Price (₹)</Text>
                <TextInput style={styles.input} value={formData.unitPrice} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, unitPrice: t})} placeholder="85" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>

            <View style={styles.previewBox}>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Estimated Total Cost:</Text>
                <Text style={styles.previewValue}>₹{((Number(formData.quantity) || 0) * (Number(formData.unitPrice) || 0)).toLocaleString()}</Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Submit Order</Text>}
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
  
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.surface, backgroundColor: colors.background },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 16, marginBottom: 0 },
  label: { fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  
  previewBox: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginTop: 4, borderWidth: 1, borderColor: colors.border },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabel: { color: colors.textSecondary, fontSize: 14 },
  previewValue: { color: '#10B981', fontSize: 18, fontWeight: 'bold' },
  
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: colors.surface, backgroundColor: colors.background, gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center' },
  cancelBtnText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#2996A8', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
