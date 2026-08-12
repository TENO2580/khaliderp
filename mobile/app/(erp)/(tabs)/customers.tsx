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
import FilterPanel from '../../../components/FilterPanel';
import ActiveFilters, { FilterConfig } from '../../../components/ActiveFilters';
import { useFilterStore } from '../../../store/filterStore';
import DatePickerField from '../../../components/DatePicker';

interface Customer {
  id: string;
  customerId: string;
  name: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  gstNumber: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  route: string;
  type: string;
  creditLimit: number;
  status: string;
  notes: string;
  sellingPrice: number;
  nextFollowupDate: string;
  lastPurchaseDate: string;
}

const CUSTOMER_TYPES = ['RETAILER', 'DISTRIBUTOR', 'WHOLESALER', 'DEALER'];
const CUSTOMER_STATUSES = ['ACTIVE', 'INACTIVE', 'LEAD', 'LOST'];

export default function CustomersScreen() {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  const [customers, setCustomers] = useState<Customer[]>(getCachedData('customers') || []);
  const [loading, setLoading] = useState(!getCachedData('customers'));
  const [isInteracting, setIsInteracting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filter State
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const filterState = useFilterStore(state => state.filters['customers']);
  const filters = filterState || {};
  
  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    phone: '',
    whatsapp: '',
    email: '',
    gstNumber: '',
    address: '',
    district: '',
    state: 'Tamil Nadu',
    pincode: '',
    route: '',
    type: 'RETAILER',
    creditLimit: '50000',
    status: 'ACTIVE',
    notes: '',
    sellingPrice: '0',
    nextFollowupDate: '',
    lastPurchaseDate: '',
  });

  const router = useRouter();

  const fetchCustomers = async () => {
    try {
      const currentFilters = useFilterStore.getState().filters['customers'] || {};

      const queryParams = new URLSearchParams({ limit: '50' });
      if (search) queryParams.append('search', search);
      if (currentFilters.status) queryParams.append('status', currentFilters.status);
      if (currentFilters.route) queryParams.append('route', currentFilters.route);
      if (currentFilters.startDate) queryParams.append('startDate', currentFilters.startDate);
      if (currentFilters.endDate) queryParams.append('endDate', currentFilters.endDate);

      const response = await api.get(`/customers?${queryParams.toString()}`);
      const customersList = response.data.data.data;
      setCustomers(customersList);
      setCachedData('customers', customersList);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsInteracting(false);
      fetchCustomers();
    });
  }, []));

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#10B981';
      case 'INACTIVE': return '#EF4444';
      case 'LEAD': return '#3B82F6';
      case 'LOST': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '', ownerName: '', phone: '', whatsapp: '', email: '', gstNumber: '',
      address: '', district: '', state: 'Tamil Nadu', pincode: '', route: '', type: 'RETAILER',
      creditLimit: '50000', status: 'ACTIVE', notes: '', sellingPrice: '0', nextFollowupDate: '', lastPurchaseDate: ''
    });
    setIsEdit(false);
    setIsModalVisible(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setFormData({
      name: customer.name || '',
      ownerName: customer.ownerName || '',
      phone: customer.phone || '',
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      gstNumber: customer.gstNumber || '',
      address: customer.address || '',
      district: customer.district || '',
      state: customer.state || 'Tamil Nadu',
      pincode: customer.pincode || '',
      route: customer.route || '',
      type: customer.type || 'RETAILER',
      creditLimit: (customer.creditLimit || 50000).toString(),
      status: customer.status || 'ACTIVE',
      notes: customer.notes || '',
      sellingPrice: (customer.sellingPrice || 0).toString(),
      nextFollowupDate: customer.nextFollowupDate ? new Date(customer.nextFollowupDate).toISOString().split('T')[0] : '',
      lastPurchaseDate: customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toISOString().split('T')[0] : '',
    });
    setEditId(customer.id);
    setIsEdit(true);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Customer Name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        creditLimit: Number(formData.creditLimit) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
      };

      if (isEdit) {
        await api.put(`/customers/${editId}`, payload);
        Alert.alert('Success', 'Customer updated successfully');
      } else {
        await api.post('/customers', payload);
        Alert.alert('Success', 'Customer created successfully');
      }
      setIsModalVisible(false);
      fetchCustomers();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column[] = [
    { key: 'actions', title: 'Actions', width: 80, render: (item) => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(item)}>
            <Feather name="edit-2" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => {
            Alert.alert('Delete Customer', `Are you sure you want to delete ${item.name}?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                  await api.delete(`/customers/${item.id}`);
                  fetchCustomers();
                } catch (err: any) {
                  Alert.alert('Error', err.response?.data?.message || 'Failed to delete customer');
                }
              }},
            ]);
          }}>
            <Feather name="trash-2" size={14} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )
    },
    { key: 'customerId', title: 'ID', width: 100 },
    { key: 'name', title: 'Name', width: 160 },
    { key: 'phone', title: 'Phone', width: 120 },
    { key: 'location', title: 'Location', width: 150, render: (item) => <Text style={styles.cellText}>{item.district ? `${item.district}, ${item.state}` : '-'}</Text> },
    { key: 'status', title: 'Status', width: 100, render: (item) => (
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
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
            <Text style={styles.pageTitle}>Customers</Text>
            <Text style={styles.pageSubtitle}>Manage all customers</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleOpenCreate}>
          <Text style={styles.newButtonText}>+ New Customer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search customers..." 
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchCustomers}
          />
        </View>
        <TouchableOpacity style={styles.actionIconBtn} onPress={() => setIsFilterVisible(true)}>
          <Feather name="filter" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ActiveFilters 
        module="customers"
        config={[
          { key: 'status', label: 'Status', type: 'select', options: CUSTOMER_STATUSES.map(s => ({ label: s, value: s })) },
          { key: 'route', label: 'Route', type: 'text' },
          { key: 'dateRange', label: 'Date', type: 'date-range' }
        ]}
        onFiltersChanged={fetchCustomers}
      />

      <FilterPanel
        module="customers"
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={fetchCustomers}
        config={[
          { key: 'status', label: 'Status', type: 'select', options: CUSTOMER_STATUSES.map(s => ({ label: s, value: s })) },
          { key: 'route', label: 'Route', type: 'text' },
          { key: 'dateRange', label: 'Date Range', type: 'date-range' }
        ]}
      />

      <View style={styles.tableWrapper}>
        <DataTable 
          columns={columns} 
          data={customers} 
          onEdit={handleOpenEdit} 
          isLoading={isInteracting || (loading && !refreshing && customers.length === 0)}
        />
      </View>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? 'Edit Customer' : 'Add New Customer'}</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Customer Name *</Text>
              <TextInput style={styles.input} value={formData.name} onChangeText={(t) => setFormData({...formData, name: t})} placeholder="Company or Individual name" placeholderTextColor={colors.textSecondary} />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Owner Name</Text>
                <TextInput style={styles.input} value={formData.ownerName} onChangeText={(t) => setFormData({...formData, ownerName: t})} placeholder="John Doe" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Phone</Text>
                <TextInput style={styles.input} value={formData.phone} keyboardType="phone-pad" onChangeText={(t) => setFormData({...formData, phone: t})} placeholder="9876543210" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Credit Limit (₹)</Text>
                <TextInput style={styles.input} value={formData.creditLimit} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, creditLimit: t})} placeholder="50000" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>GST Number</Text>
                <TextInput style={styles.input} value={formData.gstNumber} onChangeText={(t) => setFormData({...formData, gstNumber: t})} placeholder="33AAAAA0000A1Z5" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Customer Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillContainer}>
                {CUSTOMER_TYPES.map(type => (
                  <TouchableOpacity 
                    key={type} 
                    style={[styles.pill, formData.type === type && styles.pillActive]}
                    onPress={() => setFormData({...formData, type})}
                  >
                    <Text style={[styles.pillText, formData.type === type && styles.pillTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillContainer}>
                {CUSTOMER_STATUSES.map(status => (
                  <TouchableOpacity 
                    key={status} 
                    style={[styles.pill, formData.status === status && styles.pillActive]}
                    onPress={() => setFormData({...formData, status})}
                  >
                    <Text style={[styles.pillText, formData.status === status && styles.pillTextActive]}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>District / Location</Text>
                <TextInput style={styles.input} value={formData.district} onChangeText={(t) => setFormData({...formData, district: t})} placeholder="City" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Route / Area</Text>
                <TextInput style={styles.input} value={formData.route} onChangeText={(t) => setFormData({...formData, route: t})} placeholder="Areekode" placeholderTextColor={colors.textSecondary} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput style={[styles.input, styles.textArea]} value={formData.address} onChangeText={(t) => setFormData({...formData, address: t})} multiline numberOfLines={3} placeholder="Full address" placeholderTextColor={colors.textSecondary} />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Last Selling Cost (₹)</Text>
                <TextInput style={styles.input} value={formData.sellingPrice} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, sellingPrice: t})} placeholder="0" placeholderTextColor={colors.textSecondary} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <DatePickerField
                  label="Next Follow-Up"
                  value={formData.nextFollowupDate}
                  onChange={(d) => setFormData({...formData, nextFollowupDate: d})}
                  placeholder="Select date"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} value={formData.notes} onChangeText={(t) => setFormData({...formData, notes: t})} multiline numberOfLines={3} placeholder="Internal notes" placeholderTextColor={colors.textSecondary} />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{isEdit ? 'Update Customer' : 'Save Customer'}</Text>}
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
  textArea: { height: 100, textAlignVertical: 'top' },
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
