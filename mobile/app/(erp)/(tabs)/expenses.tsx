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
import SearchableDropdown from '../../../components/SearchableDropdown';

interface Expense {
  id: string;
  amount: number;
  date: string;
  description: string;
  status: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  createdBy: {
    name: string;
  };
}

const PAYMENT_METHODS = ['CASH', 'BANK TRANSFER', 'UPI', 'CHEQUE', 'NEFT', 'RTGS'];
const EXPENSE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>(getCachedData('expenses') || []);
  const [categories, setCategories] = useState<any[]>(getCachedData('expenses_categories') || []);
  const [loading, setLoading] = useState(!getCachedData('expenses'));
  const [isInteracting, setIsInteracting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: '',
    status: 'PENDING',
  });

  const fetchData = async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        api.get('/expenses?limit=500'),
        api.get('/expenses/categories')
      ]);
      const expensesList = Array.isArray(expRes.data?.data?.data) ? expRes.data.data.data : (Array.isArray(expRes.data?.data) ? expRes.data.data : []);
      setExpenses(expensesList);
      setCachedData('expenses', expensesList);
      
      const catList = Array.isArray(catRes.data?.data) ? catRes.data.data : (Array.isArray(catRes.data) ? catRes.data : []);
      setCategories(catList);
      setCachedData('expenses_categories', catList);
      
      if (Array.isArray(catList) && catList.length > 0 && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: catList[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch expenses', error);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F59E0B';
      case 'APPROVED': return '#10B981';
      case 'REJECTED': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  const getIonicIcon = (lucideName: string) => {
    switch (lucideName) {
      case 'Fuel': return 'car-outline';
      case 'Utensils': return 'restaurant-outline';
      case 'Wrench': return 'construct-outline';
      case 'Hotel': return 'bed-outline';
      default: return 'receipt-outline';
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      categoryId: categories.length > 0 ? categories[0].id : '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      paymentMethod: '',
      status: 'PENDING',
    });
    setIsEdit(false);
    setIsModalVisible(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setFormData({
      categoryId: expense.categoryId || expense.category?.id || (categories.length > 0 ? categories[0].id : ''),
      amount: expense.amount.toString(),
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      description: expense.description || '',
      paymentMethod: '',
      status: expense.status || 'PENDING',
    });
    setEditId(expense.id);
    setIsEdit(true);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!formData.amount) {
      Alert.alert('Error', 'Amount is required');
      return;
    }
    
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/expenses/${editId}`, {
          categoryId: formData.categoryId,
          amount: Number(formData.amount),
          date: formData.date,
          description: formData.description,
          status: formData.status
        });
        Alert.alert('Success', 'Expense updated successfully');
      } else {
        const descParts = [formData.description, formData.paymentMethod ? `Payment: ${formData.paymentMethod}` : ''].filter(Boolean).join(' | ');
        await api.post('/expenses', {
          categoryId: formData.categoryId,
          amount: Number(formData.amount),
          date: formData.date,
          description: descParts || formData.description,
        });
        Alert.alert('Success', 'Expense recorded successfully');
      }
      setIsModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column[] = [
    { key: 'actions', title: 'Actions', width: 80, render: (item) => (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(item)}>
            <Feather name="edit-2" size={14} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => {
            Alert.alert('Delete Expense', 'Are you sure you want to delete this expense?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                  await api.delete(`/expenses/${item.id}`);
                  fetchData();
                } catch (err: any) {
                  Alert.alert('Error', err.response?.data?.message || 'Failed to delete expense');
                }
              }},
            ]);
          }}>
            <Feather name="trash-2" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )
    },
    { key: 'date', title: 'Date', width: 120, render: (item) => <Text style={styles.cellText}>{new Date(item.date).toLocaleDateString()}</Text> },
    { key: 'category', title: 'Category', width: 140, render: (item) => (
        <View style={styles.categoryRow}>
          <View style={[styles.iconWrapper, { backgroundColor: (item.category?.color || '#3B82F6') + '20' }]}>
            <Ionicons name={getIonicIcon(item.category?.icon) as any} size={16} color={item.category?.color || '#3B82F6'} />
          </View>
          <Text style={styles.cellText} numberOfLines={1}>{item.category?.name || 'Uncategorized'}</Text>
        </View>
      )
    },
    { key: 'amount', title: 'Amount', width: 100, render: (item) => <Text style={styles.cellText}>₹{item.amount.toLocaleString()}</Text> },
    { key: 'createdBy', title: 'Submitted By', width: 140, render: (item) => (
      <Text style={styles.cellText} numberOfLines={1} onLongPress={() => Alert.alert('Submitted By', item.createdBy?.name || '-')}>
        {item.createdBy?.name || '-'}
      </Text>
    ) },
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
            <Ionicons name="arrow-back" size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Expenses</Text>
            <Text style={styles.pageSubtitle}>Manage company expenses</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleOpenCreate}>
          <Text style={styles.newButtonText}>+ New Expense</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search expenses..." 
            placeholderTextColor="#64748B"
          />
        </View>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Feather name="filter" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tableWrapper}>
        {isInteracting || (loading && !refreshing && expenses.length === 0) ? (
          <SkeletonList />
        ) : (
          <DataTable columns={columns} data={expenses} showActions={false} />
        )}
      </View>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{isEdit ? 'Edit Expense' : 'Record New Expense'}</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <SearchableDropdown
                data={Array.isArray(categories) ? categories : []}
                value={formData.categoryId}
                onSelect={(val) => setFormData({...formData, categoryId: val})}
                placeholder="Select Expense Category"
                searchPlaceholder="Search categories..."
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Amount (₹) *</Text>
                <TextInput style={styles.input} value={formData.amount} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, amount: t})} placeholder="1000" placeholderTextColor="#64748B" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date *</Text>
                <TextInput style={styles.input} value={formData.date} onChangeText={(t) => setFormData({...formData, date: t})} placeholder="YYYY-MM-DD" placeholderTextColor="#64748B" />
              </View>
            </View>

            {!isEdit && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Payment Method</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillContainer}>
                  {PAYMENT_METHODS.map((pm: string) => (
                    <TouchableOpacity 
                      key={pm} 
                      style={[styles.pill, formData.paymentMethod === pm && styles.pillActive]}
                      onPress={() => setFormData({...formData, paymentMethod: pm})}
                    >
                      <Text style={[styles.pillText, formData.paymentMethod === pm && styles.pillTextActive]}>{pm}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {isEdit && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillContainer}>
                  {EXPENSE_STATUSES.map(status => (
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
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes / Description</Text>
              <TextInput style={[styles.input, styles.textArea]} value={formData.description} onChangeText={(t) => setFormData({...formData, description: t})} multiline numberOfLines={3} placeholder="e.g. FUEL, supplier name etc." placeholderTextColor="#64748B" />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Submit Expense'}</Text>}
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
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  iconWrapper: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  actionBtn: { padding: 8 },
  
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
  textArea: { height: 100, textAlignVertical: 'top' },
  pillContainer: { flexDirection: 'row' },
  pill: { backgroundColor: '#1E1E1E', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#27272A' },
  pillActive: { backgroundColor: '#2996A8', borderColor: '#2996A8' },
  pillText: { color: '#94A3B8', fontSize: 14, fontWeight: 'bold' },
  pillTextActive: { color: '#FFFFFF' },
  modalFooter: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#1E1E1E', backgroundColor: '#121212', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#1E1E1E', alignItems: 'center' },
  cancelBtnText: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold' },
  saveBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#2996A8', alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
