import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { DataTable, Column } from '../../../components/DataTable';
import { getCachedData, setCachedData } from '../../../lib/cache';
import SkeletonList from '../../../components/SkeletonList';

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

export default function PurchaseScreen() {
  const [orders, setOrders] = useState<PurchaseOrder[]>(getCachedData('purchase') || []);
  const [loading, setLoading] = useState(!getCachedData('purchase'));
  const [isInteracting, setIsInteracting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

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
      const res = await api.get('/purchase?limit=500');
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
      case 'DRAFT': return '#94A3B8';
      case 'ORDERED': return '#3B82F6';
      case 'PARTIALLY_RECEIVED': return '#F59E0B';
      case 'RECEIVED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return '#64748B';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'UNPAID': return '#EF4444';
      case 'PARTIAL': return '#F59E0B';
      case 'PAID': return '#10B981';
      default: return '#64748B';
    }
  };

  const columns: Column[] = [
    { key: 'poNumber', title: 'PO #', width: 90, render: (item) => <Text style={[styles.cellText, { color: '#3B82F6', fontWeight: 'bold' }]}>{item.poNumber}</Text> },
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
            <Ionicons name="arrow-back" size={24} color="#9CA3AF" />
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
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search PO # or supplier..." 
            placeholderTextColor="#64748B"
          />
        </View>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Feather name="filter" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

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
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Supplier Name *</Text>
              <TextInput style={styles.input} value={formData.supplierName} onChangeText={(t) => setFormData({...formData, supplierName: t})} placeholder="Supplier Name" placeholderTextColor="#64748B" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Raw Material Item *</Text>
              <TextInput style={styles.input} value={formData.material} onChangeText={(t) => setFormData({...formData, material: t})} placeholder="e.g. Paraffin Wax" placeholderTextColor="#64748B" />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput style={styles.input} value={formData.quantity} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, quantity: t})} placeholder="500" placeholderTextColor="#64748B" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Unit Price (₹)</Text>
                <TextInput style={styles.input} value={formData.unitPrice} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, unitPrice: t})} placeholder="85" placeholderTextColor="#64748B" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4, marginLeft: -4 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
  pageSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  newButton: { backgroundColor: '#2996A8', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  newButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  actionBar: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', borderRadius: 8, paddingHorizontal: 12, height: 36, gap: 8 },
  searchInput: { flex: 1, color: '#F8FAFC', fontSize: 14, height: '100%' },
  actionIconBtn: { width: 36, height: 36, backgroundColor: '#1E1E1E', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tableWrapper: { flex: 1, paddingHorizontal: 16, paddingBottom: 80 },
  cellText: { color: '#F8FAFC', fontSize: 14 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#121212' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1E1E1E', backgroundColor: '#121212' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row', gap: 16, marginBottom: 0 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, color: '#F8FAFC', fontSize: 16, borderWidth: 1, borderColor: '#27272A' },
  
  previewBox: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginTop: 4, borderWidth: 1, borderColor: '#27272A' },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewLabel: { color: '#94A3B8', fontSize: 14 },
  previewValue: { color: '#10B981', fontSize: 18, fontWeight: 'bold' },
  
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#1E1E1E', backgroundColor: '#121212', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#1E1E1E', alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#2996A8', alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
