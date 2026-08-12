import React, { useEffect, useState, useCallback } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { DataTable, Column } from '../../../components/DataTable';
import { getCachedData, setCachedData } from '../../../lib/cache';
import SkeletonList from '../../../components/SkeletonList';
import SearchableDropdown from '../../../components/SearchableDropdown';
import DatePickerField from '../../../components/DatePicker';
import { formatDate } from '../../../lib/utils';

interface Batch {
  id: string;
  batchNumber: string;
  purchaseDate: string;
  productId: string;
  product?: { name: string };
  waxInitialQty: number;
  waxRate: number;
  waxStock: number;
  producedQty: number;
  soldQty: number;
  remainingQty: number;
  sellingPrice: number;
  productionCost: number;
  status: string;
}

export default function BatchesScreen() {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  const [batches, setBatches] = useState<Batch[]>(getCachedData('production') || []);
  const [products, setProducts] = useState<any[]>(getCachedData('production_products') || []);
  const [loading, setLoading] = useState(!getCachedData('production'));
  const [isInteracting, setIsInteracting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);

  const [productId, setProductId] = useState('');
  
  const [formData, setFormData] = useState({
    purchaseDate: new Date().toISOString().split('T')[0],
    waxInitialQty: '',
    waxRate: '',
    waxStock: '',
    producedQty: '',
    sellingPrice: '350',
    soldQty: '0',
    status: 'IN_PRODUCTION'
  });

  const fetchData = async () => {
    try {
      const [batchRes, prodRes] = await Promise.all([
        api.get('/production/batches/list?limit=500'),
        api.get('/inventory?limit=500')
      ]);
      const batchesList = batchRes.data.data.data || batchRes.data.data;
      setBatches(batchesList);
      setCachedData('production', batchesList);
      
      const productsList = prodRes.data.data.data || prodRes.data.data;
      setProducts(productsList);
      setCachedData('production_products', productsList);
    } catch (error) {
      console.error('Failed to fetch batches', error);
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
    setProductId(products.length > 0 ? (products[0].product?.id || products[0].id) : '');
    setFormData({
      purchaseDate: new Date().toISOString().split('T')[0],
      waxInitialQty: '',
      waxRate: '',
      waxStock: '',
      producedQty: '',
      sellingPrice: '350',
      soldQty: '0',
      status: 'IN_PRODUCTION'
    });
    setIsEdit(false);
    setIsModalVisible(true);
  };

  const handleOpenEdit = (batch: Batch) => {
    setProductId(batch.productId || '');
    setFormData({
      purchaseDate: batch.purchaseDate ? new Date(batch.purchaseDate).toISOString().split('T')[0] : '',
      waxInitialQty: (batch.waxInitialQty || 0).toString(),
      waxRate: (batch.waxRate || 0).toString(),
      waxStock: (batch.waxStock || 0).toString(),
      producedQty: (batch.producedQty || 0).toString(),
      sellingPrice: (batch.sellingPrice || 0).toString(),
      soldQty: (batch.soldQty || 0).toString(),
      status: batch.status || 'IN_PRODUCTION',
    });
    setEditId(batch.id);
    setIsEdit(true);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.waxInitialQty || !formData.waxRate) {
      Alert.alert('Error', 'Wax Initial Qty and Wax Rate are required');
      return;
    }
    
    setSaving(true);
    try {
      const wInitial = Number(formData.waxInitialQty) || 0;
      const wRate = Number(formData.waxRate) || 0;
      const prodQty = Number(formData.producedQty) || 0;
      const sQty = Number(formData.soldQty) || 0;

      if (isEdit) {
        await api.put(`/production/batches/${editId}`, {
          purchaseDate: formData.purchaseDate,
          waxInitialQty: wInitial,
          waxRate: wRate,
          waxStock: wInitial - prodQty,
          producedQty: prodQty,
          sellingPrice: Number(formData.sellingPrice) || 0,
          soldQty: sQty,
          remainingQty: prodQty - sQty,
          productionCost: wInitial * wRate,
          status: formData.status
        });
        Alert.alert('Success', 'Batch updated successfully');
      } else {
        await api.post('/production/batches', {
          productId: productId || undefined,
          purchaseDate: formData.purchaseDate,
          sellingPrice: Number(formData.sellingPrice) || 0,
          waxInitialQty: wInitial,
          waxRate: wRate,
          waxStock: Number(formData.waxStock) || 0,
          producedQty: prodQty
        });
        Alert.alert('Success', 'New batch generated successfully');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save batch');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'COMPLETED' ? '#10B981' : colors.tint;
  };

  const columns: Column[] = [
    { key: 'actions', title: 'Actions', width: 70, render: (item) => (
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(item)}>
          <Feather name="edit-2" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      )
    },
    { key: 'product', title: 'Product', width: 120, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]} numberOfLines={1}>{item.product?.name || 'General'}</Text> },
    { key: 'producedQty', title: 'Produced', width: 80, render: (item) => <Text style={styles.cellText}>{Number(item.producedQty).toFixed(2)}</Text> },
    { key: 'soldQty', title: 'Sold', width: 80, render: (item) => <Text style={[styles.cellText, { color: '#10B981' }]}>{Number(item.soldQty).toFixed(2)}</Text> },
    { key: 'remainingQty', title: 'Remaining', width: 90, render: (item) => <Text style={[styles.cellText, { color: '#F59E0B' }]}>{Number(item.remainingQty).toFixed(2)}</Text> },
    { key: 'status', title: 'Status', width: 110, render: (item) => (
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.replace('_', ' ')}</Text>
        </View>
      )
    },
    
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
            <Text style={styles.pageTitle}>Batches</Text>
            <Text style={styles.pageSubtitle}>Batch management & raw materials</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleOpenCreate}>
          <Text style={styles.newButtonText}>+ New Batch</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search batch number..." 
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Feather name="filter" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tableWrapper}>
        {isInteracting || (loading && !refreshing && batches.length === 0) ? (
          <SkeletonList />
        ) : (
          <DataTable columns={columns} data={batches} showActions={false} />
        )}
      </View>

      {/* CREATE / EDIT MODAL */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? 'Edit Batch' : 'Generate Batch Code'}</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Target Product</Text>
              <SearchableDropdown
                data={[{ id: '', name: 'General' }, ...products.map((p: any) => ({
                  id: p.product?.id || p.id,
                  name: p.product?.name || p.name
                })).filter(p => p.id)]}
                value={productId}
                onSelect={setProductId}
                placeholder="Select Target Product"
                searchPlaceholder="Search product by name..."
              />
            </View>

            <View style={styles.formGroup}>
              <DatePickerField
                label="Purchase Date *"
                value={formData.purchaseDate}
                onChange={(d) => setFormData({...formData, purchaseDate: d})}
                placeholder="Select purchase date"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Wax Initial Qty *</Text>
                <TextInput style={styles.input} value={formData.waxInitialQty} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, waxInitialQty: t})} placeholder="KG" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Wax Rate (₹) *</Text>
                <TextInput style={styles.input} value={formData.waxRate} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, waxRate: t})} placeholder="0.00" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>

            {!isEdit && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Initial Wax Stock (KG) *</Text>
                <TextInput style={styles.input} value={formData.waxStock} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, waxStock: t})} placeholder="KG" placeholderTextColor={colors.textSecondary} />
              </View>
            )}

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Candles Produced</Text>
                <TextInput style={styles.input} value={formData.producedQty} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, producedQty: t})} placeholder="KG" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Selling Price (₹)</Text>
                <TextInput style={styles.input} value={formData.sellingPrice} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, sellingPrice: t})} placeholder="0.00" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>

            {isEdit && (
              <>
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Candles Sold (KG)</Text>
                    <TextInput style={styles.input} value={formData.soldQty} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, soldQty: t})} placeholder="KG" placeholderTextColor={colors.textSecondary} />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Status</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity 
                      style={[styles.pill, formData.status === 'IN_PRODUCTION' && styles.pillActive]}
                      onPress={() => setFormData({...formData, status: 'IN_PRODUCTION'})}
                    >
                      <Text style={[styles.pillText, formData.status === 'IN_PRODUCTION' && styles.pillTextActive]}>In Production</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.pill, formData.status === 'COMPLETED' && styles.pillActive]}
                      onPress={() => setFormData({...formData, status: 'COMPLETED'})}
                    >
                      <Text style={[styles.pillText, formData.status === 'COMPLETED' && styles.pillTextActive]}>Completed</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Create Batch'}</Text>}
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
  label: { fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  pillContainer: { flexDirection: 'row' },
  pill: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: '#2996A8', borderColor: '#2996A8' },
  pillText: { color: colors.textSecondary, fontSize: 14, fontWeight: 'bold' },
  pillTextActive: { color: '#fff' },
  
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: colors.surface, backgroundColor: colors.background, gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center' },
  cancelBtnText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#2996A8', alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
