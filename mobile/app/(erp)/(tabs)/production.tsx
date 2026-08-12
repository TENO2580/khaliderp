import React, { useEffect, useState, useCallback } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { StyleSheet, View, TouchableOpacity, TextInput, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, InteractionManager, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { DataTable, Column } from '../../../components/DataTable';
import { getCachedData, setCachedData } from '../../../lib/cache';
import SkeletonList from '../../../components/SkeletonList';
import SearchableDropdown from '../../../components/SearchableDropdown';
import { useAuthStore } from '../../../store/authStore';
import FilterPanel from '../../../components/FilterPanel';
import ActiveFilters from '../../../components/ActiveFilters';
import { useFilterStore } from '../../../store/filterStore';
import DatePickerField from '../../../components/DatePicker';
import { formatDate } from '../../../lib/utils';

export default function ProductionScreen() {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  const [productions, setProductions] = useState<any[]>(getCachedData('production_runs') || []);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(!getCachedData('production_runs'));
  const [isInteracting, setIsInteracting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const filterState = useFilterStore(state => state.filters['production']);
  const filters = filterState || {};

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    batchId: '',
    operatorId: user?.id || '',
    shift: 'DAY',
    waxUsed: '100',
    fragranceUsed: '2',
    colorUsed: '0.5',
    containerUsed: '500',
    wickUsed: '500',
    labourCost: '1500',
    gasCost: '400',
    electricityCost: '200',
    otherCosts: '100',
    quantityProduced: '100',
    sellingPrice: '350',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const queryParams = new URLSearchParams({ limit: '500' });
      if (search) queryParams.append('search', search);

      const [prodRes, batchRes] = await Promise.all([
        api.get(`/production?${queryParams.toString()}`),
        api.get('/production/batches/list?limit=500')
      ]);
      let prodList = prodRes.data.data.data || prodRes.data.data || [];
      
      // Local filtering for shift if present
      if (filters.shift) {
        prodList = prodList.filter((p: any) => p.shift === filters.shift);
      }
      // Local filtering for date range if backend doesn't support it but user requested it
      if (filters.startDate) {
        prodList = prodList.filter((p: any) => new Date(p.date) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        prodList = prodList.filter((p: any) => new Date(p.date) <= new Date(filters.endDate));
      }
      const batchList = batchRes.data.data.data || batchRes.data.data || [];
      setProductions(Array.isArray(prodList) ? prodList : []);
      setBatches(Array.isArray(batchList) ? batchList : []);
      setCachedData('production_runs', Array.isArray(prodList) ? prodList : []);
    } catch (err) {
      console.error('Failed to fetch productions', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let task = InteractionManager.runAfterInteractions(() => {
        setIsInteracting(false);
        fetchData();
      });
      return () => task.cancel();
    }, [])
  );

  const handleOpenCreate = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      batchId: '',
      operatorId: user?.id || '',
      shift: 'DAY',
      waxUsed: '100',
      fragranceUsed: '2',
      colorUsed: '0.5',
      containerUsed: '500',
      wickUsed: '500',
      labourCost: '1500',
      gasCost: '400',
      electricityCost: '200',
      otherCosts: '100',
      quantityProduced: '100',
      sellingPrice: '350',
      notes: '',
    });
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.batchId) {
      Alert.alert('Error', 'Please select a batch');
      return;
    }
    
    setSaving(true);
    try {
      await api.post('/production', {
        ...formData,
        waxUsed: Number(formData.waxUsed) || 0,
        fragranceUsed: Number(formData.fragranceUsed) || 0,
        colorUsed: Number(formData.colorUsed) || 0,
        containerUsed: Number(formData.containerUsed) || 0,
        wickUsed: Number(formData.wickUsed) || 0,
        labourCost: Number(formData.labourCost) || 0,
        gasCost: Number(formData.gasCost) || 0,
        electricityCost: Number(formData.electricityCost) || 0,
        otherCosts: Number(formData.otherCosts) || 0,
        quantityProduced: Number(formData.quantityProduced) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
      });
      Alert.alert('Success', 'Production run logged successfully');
      setIsModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to log production');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column[] = [
    { key: 'productionNumber', title: 'Prod #', width: 90, render: (item) => <Text style={[styles.cellText, { color: colors.tint, fontWeight: 'bold' }]}>{item.productionNumber}</Text> },
    { key: 'date', title: 'Date & Shift', width: 100, render: (item) => (
        <View>
          <Text style={styles.cellText}>{formatDate(item.date)}</Text>
          <Text style={[styles.cellText, { color: colors.textSecondary, fontSize: 10 }]}>{item.shift} Shift</Text>
        </View>
      )
    },
    { key: 'quantityProduced', title: 'Output Qty', width: 90, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]}>{Number(item.quantityProduced).toFixed(2)} KG</Text> },
    { key: 'notes', title: 'Notes', width: 150, render: (item) => <Text style={styles.cellText} numberOfLines={1}>{item.notes || '-'}</Text> }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Production</Text>
            <Text style={styles.pageSubtitle}>Log daily production runs</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleOpenCreate}>
          <Text style={styles.newButtonText}>+ Log Run</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search production runs..." 
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
        module="production"
        config={[
          { key: 'shift', label: 'Shift', type: 'select', options: [{label: 'DAY', value: 'DAY'}, {label: 'NIGHT', value: 'NIGHT'}] },
          { key: 'dateRange', label: 'Date', type: 'date-range' }
        ]}
        onFiltersChanged={fetchData}
      />

      <FilterPanel
        module="production"
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={fetchData}
        config={[
          { key: 'shift', label: 'Shift', type: 'select', options: [{label: 'DAY', value: 'DAY'}, {label: 'NIGHT', value: 'NIGHT'}] },
          { key: 'dateRange', label: 'Date Range', type: 'date-range' }
        ]}
      />

      <View style={styles.tableWrapper}>
        {isInteracting || (loading && !refreshing && productions.length === 0) ? (
          <SkeletonList />
        ) : (
          <DataTable columns={columns} data={productions} showActions={false} />
        )}
      </View>

      {/* CREATE MODAL */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Log Daily Production Run</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Batch *</Text>
              <SearchableDropdown
                data={batches.map((b: any) => ({
                  id: b.id,
                  name: `${b.batchNumber} (${b.product?.name || 'General'})`
                }))}
                value={formData.batchId}
                onSelect={(val) => setFormData({...formData, batchId: val})}
                placeholder="Select a batch..."
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
                <DatePickerField
                  label="Date *"
                  value={formData.date}
                  onChange={(d) => setFormData({...formData, date: d})}
                  placeholder="Select date"
                />
              </View>
              <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.label}>Shift *</Text>
                <View style={styles.chipContainer}>
                  <TouchableOpacity 
                    style={[styles.chip, formData.shift === 'DAY' && styles.chipActive]}
                    onPress={() => setFormData({...formData, shift: 'DAY'})}
                  >
                    <Text style={[styles.chipText, formData.shift === 'DAY' && styles.chipTextActive]}>DAY</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.chip, formData.shift === 'NIGHT' && styles.chipActive]}
                    onPress={() => setFormData({...formData, shift: 'NIGHT'})}
                  >
                    <Text style={[styles.chipText, formData.shift === 'NIGHT' && styles.chipTextActive]}>NIGHT</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Material Usage</Text>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.label}>Wax Used (KG) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.waxUsed}
                  onChangeText={(text) => setFormData({...formData, waxUsed: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
              <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.label}>Fragrance (KG) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fragranceUsed}
                  onChangeText={(text) => setFormData({...formData, fragranceUsed: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.label}>Color (KG) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.colorUsed}
                  onChangeText={(text) => setFormData({...formData, colorUsed: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
              <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.label}>Containers *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.containerUsed}
                  onChangeText={(text) => setFormData({...formData, containerUsed: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Wicks Used *</Text>
              <TextInput
                style={styles.input}
                value={formData.wickUsed}
                onChangeText={(text) => setFormData({...formData, wickUsed: text})}
                keyboardType="numeric"
                placeholderTextColor="#6B7280"
              />
            </View>

            <Text style={styles.sectionTitle}>Overhead Costs (₹)</Text>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.label}>Labour Cost *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.labourCost}
                  onChangeText={(text) => setFormData({...formData, labourCost: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
              <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.label}>Gas Cost *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.gasCost}
                  onChangeText={(text) => setFormData({...formData, gasCost: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.label}>Electricity *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.electricityCost}
                  onChangeText={(text) => setFormData({...formData, electricityCost: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
              <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.label}>Other Costs *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.otherCosts}
                  onChangeText={(text) => setFormData({...formData, otherCosts: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Production Output</Text>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.label}>Qty Produced (KG) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.quantityProduced}
                  onChangeText={(text) => setFormData({...formData, quantityProduced: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
              <View style={[styles.formGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.label}>Target Selling Price *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.sellingPrice}
                  onChangeText={(text) => setFormData({...formData, sellingPrice: text})}
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={formData.notes}
                onChangeText={(text) => setFormData({...formData, notes: text})}
                multiline
                placeholder="Optional notes..."
                placeholderTextColor="#6B7280"
              />
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Log Production</Text>}
              </TouchableOpacity>
            </View>
            
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.text, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  pageSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  newButton: { backgroundColor: '#2996A8', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  newButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  actionBar: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 12 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.text, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, color: '#FFF', marginLeft: 8, fontSize: 14 },
  actionIconBtn: { width: 44, height: 44, backgroundColor: colors.text, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tableWrapper: { flex: 1, paddingHorizontal: 20 },
  cellText: { color: colors.border, fontSize: 13 },
  modalContainer: { flex: 1, backgroundColor: '#000' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.text },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20, paddingBottom: 100 },
  formRow: { flexDirection: 'row', justifyContent: 'space-between' },
  formGroup: { marginBottom: 16 },
  label: { color: colors.border, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: colors.text, color: '#FFF', borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1, borderColor: colors.text },
  sectionTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginTop: 8, marginBottom: 16, letterSpacing: 1 },
  chipContainer: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, backgroundColor: colors.text, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.text },
  chipActive: { backgroundColor: '#2996A820', borderColor: '#2996A8' },
  chipText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#2996A8' },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: colors.text, alignItems: 'center' },
  cancelBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#2996A8', alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
