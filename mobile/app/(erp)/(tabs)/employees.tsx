import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, TextInput, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { DataTable, Column } from '../../../components/DataTable';
import { getCachedData, setCachedData } from '../../../lib/cache';
import SkeletonList from '../../../components/SkeletonList';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  salary: number;
  status: string;
}

const DEPARTMENTS = ['Production', 'Warehouse', 'Sales', 'Administration'];
const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'];

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>(getCachedData('employees') || []);
  const [loading, setLoading] = useState(!getCachedData('employees'));
  const [isInteracting, setIsInteracting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Modal States
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAttendanceModalVisible, setIsAttendanceModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [attStatus, setAttStatus] = useState('PRESENT');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    designation: 'Machine Operator',
    department: 'Production',
    salary: '18000',
    joinDate: new Date().toISOString().slice(0, 10),
  });

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      const employeesList = response.data.data.data || response.data.data;
      setEmployees(employeesList);
      setCachedData('employees', employeesList);
    } catch (error) {
      console.error('Failed to fetch employees', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsInteracting(false);
      fetchEmployees();
    });
  }, []));

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      phone: '',
      designation: 'Machine Operator',
      department: 'Production',
      salary: '18000',
      joinDate: new Date().toISOString().slice(0, 10),
    });
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Full Name is required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/employees', {
        ...formData,
        salary: Number(formData.salary) || 0
      });
      Alert.alert('Success', 'Employee created successfully');
      setIsModalVisible(false);
      fetchEmployees();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAttendance = (emp: Employee) => {
    setSelectedEmp(emp);
    setAttStatus('PRESENT');
    setIsAttendanceModalVisible(true);
  };

  const handleSaveAttendance = async () => {
    if (!selectedEmp) return;
    setSaving(true);
    try {
      await api.post('/employees/attendance', {
        employeeId: selectedEmp.id,
        date: new Date().toISOString(),
        status: attStatus,
      });
      Alert.alert('Success', `Attendance marked (${attStatus}) for ${selectedEmp.name}`);
      setIsAttendanceModalVisible(false);
      fetchEmployees();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column[] = [
    { key: 'actions', title: 'Attendance', width: 120, render: (item) => (
        <TouchableOpacity style={styles.attendanceBtn} onPress={() => handleOpenAttendance(item)}>
          <MaterialIcons name="event-available" size={16} color="#9CA3AF" />
          <Text style={styles.attendanceBtnText}>Mark Today</Text>
        </TouchableOpacity>
      )
    },
    { key: 'employeeId', title: 'Emp ID', width: 90 },
    { key: 'name', title: 'Name', width: 150, render: (item) => (
        <View style={styles.nameRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.cellText} numberOfLines={1} onLongPress={() => Alert.alert('Name', item.name)}>
            {item.name}
          </Text>
        </View>
      )
    },
    { key: 'designation', title: 'Designation & Dept', width: 160, render: (item) => (
        <View>
          <Text style={styles.cellText} numberOfLines={1}>{item.designation}</Text>
          <Text style={{ fontSize: 12, color: '#94A3B8' }}>{item.department}</Text>
        </View>
      )
    },
    { key: 'phone', title: 'Phone', width: 120 },
    { key: 'status', title: 'Status', width: 100, render: (item) => (
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACTIVE' ? '#10B98120' : '#EF444420' }]}>
          <Text style={[styles.statusText, { color: item.status === 'ACTIVE' ? '#10B981' : '#EF4444' }]}>{item.status}</Text>
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
            <Text style={styles.pageTitle}>Employees</Text>
            <Text style={styles.pageSubtitle}>Manage your team</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleOpenCreate}>
          <Text style={styles.newButtonText}>+ New Employee</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search employees..." 
            placeholderTextColor="#64748B"
          />
        </View>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Feather name="filter" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tableWrapper}>
        {isInteracting || (loading && !refreshing && employees.length === 0) ? (
          <SkeletonList />
        ) : (
          <DataTable columns={columns} data={employees} showActions={false} />
        )}
      </View>

      {/* CREATE EMPLOYEE MODAL */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Employee</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput style={styles.input} value={formData.name} onChangeText={(t) => setFormData({...formData, name: t})} placeholder="John Doe" placeholderTextColor="#64748B" />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Phone</Text>
                <TextInput style={styles.input} value={formData.phone} keyboardType="phone-pad" onChangeText={(t) => setFormData({...formData, phone: t})} placeholder="9876543210" placeholderTextColor="#64748B" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Salary (₹/mo)</Text>
                <TextInput style={styles.input} value={formData.salary} keyboardType="numeric" onChangeText={(t) => setFormData({...formData, salary: t})} placeholder="18000" placeholderTextColor="#64748B" />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Designation</Text>
              <TextInput style={styles.input} value={formData.designation} onChangeText={(t) => setFormData({...formData, designation: t})} placeholder="Machine Operator" placeholderTextColor="#64748B" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Department</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillContainer}>
                {DEPARTMENTS.map(dept => (
                  <TouchableOpacity 
                    key={dept} 
                    style={[styles.pill, formData.department === dept && styles.pillActive]}
                    onPress={() => setFormData({...formData, department: dept})}
                  >
                    <Text style={[styles.pillText, formData.department === dept && styles.pillTextActive]}>{dept}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Employee</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MARK ATTENDANCE MODAL */}
      <Modal visible={isAttendanceModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsAttendanceModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.smallModal}>
            <View style={styles.modalHeaderCentered}>
              <Text style={styles.modalTitle}>Mark Attendance</Text>
              <Text style={styles.subtitleText}>{selectedEmp?.name} ({selectedEmp?.employeeId})</Text>
            </View>

            <View style={styles.statusGrid}>
              {ATTENDANCE_STATUSES.map((status) => (
                <TouchableOpacity 
                  key={status} 
                  style={[styles.statusBox, attStatus === status && styles.statusBoxActive]}
                  onPress={() => setAttStatus(status)}
                >
                  <Text style={[styles.statusBoxText, attStatus === status && styles.statusBoxTextActive]}>
                    {status.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.modalFooter, { borderTopWidth: 0, paddingHorizontal: 0, paddingBottom: 0, marginTop: 10 }]}>
              <TouchableOpacity style={[styles.cancelBtn, { padding: 12 }]} onPress={() => setIsAttendanceModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { padding: 12 }]} onPress={handleSaveAttendance} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  attendanceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#3B82F620', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  attendanceBtnText: { color: '#3B82F6', fontSize: 12, fontWeight: 'bold' },
  
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

  // Small centered modal styles
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  smallModal: { width: '100%', backgroundColor: '#121212', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1E1E1E' },
  modalHeaderCentered: { alignItems: 'center', marginBottom: 20 },
  subtitleText: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  statusGrid: { flexDirection: 'column', gap: 10 },
  statusBox: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1E1E1E', backgroundColor: '#121212', alignItems: 'center' },
  statusBoxActive: { borderColor: '#3B82F6', backgroundColor: '#3B82F620' },
  statusBoxText: { color: '#94A3B8', fontSize: 14, fontWeight: 'bold' },
  statusBoxTextActive: { color: '#3B82F6' },
});
