import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { useAuthStore } from '../../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { ROLE_LABELS } from '../../../lib/constants';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of Tripidio ERP?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: logout }
      ]
    );
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#9CA3AF" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{ROLE_LABELS[user.role] || user.role}</Text>
        </View>
      </View>

      {/* Account Info */}
      <Text style={styles.sectionTitle}>Account Information</Text>
      <View style={styles.infoGroup}>
        <InfoRow icon="person-outline" label="Name" value={user.name} />
        <InfoRow icon="mail-outline" label="Email" value={user.email} />
        <InfoRow icon="shield-checkmark-outline" label="Role" value={ROLE_LABELS[user.role] || user.role} />
        <InfoRow icon="finger-print-outline" label="User ID" value={user.id.substring(0, 12) + '...'} />
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.menuGroup}>
        <MenuButton icon="settings-outline" title="Settings" onPress={() => router.push('/(erp)/(tabs)/settings' as any)} />
        <MenuButton icon="stats-chart-outline" title="Reports" onPress={() => router.push('/(erp)/(tabs)/reports' as any)} />
        <MenuButton icon="notifications-outline" title="Notifications" onPress={() => router.push('/(erp)/(tabs)/notifications' as any)} />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const InfoRow = ({ icon, label, value }: any) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLeft}>
      <Ionicons name={icon} size={18} color="#94A3B8" />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
  </View>
);

const MenuButton = ({ icon, title, onPress }: any) => (
  <TouchableOpacity style={styles.menuButton} onPress={onPress}>
    <View style={styles.menuLeft}>
      <Ionicons name={icon} size={20} color="#94A3B8" />
      <Text style={styles.menuTitle}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#475569" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
  profileSection: {
    alignItems: 'center', paddingVertical: 24, backgroundColor: '#1E1E1E',
    borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#27272A',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#2996A8',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#94A3B8', marginBottom: 12 },
  roleBadge: { backgroundColor: '#2996A820', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  roleText: { color: '#2996A8', fontWeight: 'bold', fontSize: 12 },
  sectionTitle: {
    fontSize: 12, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase',
    marginBottom: 12, marginLeft: 4, letterSpacing: 0.5,
  },
  infoGroup: {
    backgroundColor: '#1E1E1E', borderRadius: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#27272A', overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#27272A',
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 13, color: '#94A3B8' },
  infoValue: { fontSize: 13, color: '#F8FAFC', fontWeight: 'bold', maxWidth: '50%' },
  menuGroup: {
    backgroundColor: '#1E1E1E', borderRadius: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#27272A', overflow: 'hidden',
  },
  menuButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#27272A',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuTitle: { fontSize: 15, color: '#F8FAFC' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EF444420', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#EF444450',
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },
});
