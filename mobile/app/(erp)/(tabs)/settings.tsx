import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { useAuthStore } from '../../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { ROLE_LABELS } from '../../../lib/constants';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

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

      <Text style={styles.sectionTitle}>Account Settings</Text>
      <View style={styles.menuGroup}>
        <MenuButton icon="person-outline" title="Edit Profile" />
        <MenuButton icon="lock-closed-outline" title="Change Password" />
        <MenuButton icon="notifications-outline" title="Notifications" />
      </View>

      <Text style={styles.sectionTitle}>App Settings</Text>
      <View style={styles.menuGroup}>
        <MenuButton icon="color-palette-outline" title="Theme (Dark)" />
        <MenuButton icon="language-outline" title="Language" />
        <MenuButton icon="information-circle-outline" title="About Tripidio" />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Tripidio ERP v1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const MenuButton = ({ icon, title }: any) => (
  <TouchableOpacity style={styles.menuButton}>
    <View style={styles.menuLeft}>
      <Ionicons name={icon} size={20} color="#94A3B8" />
      <Text style={styles.menuTitle}>{title}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#475569" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F6',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#94A3B8', marginBottom: 12 },
  roleBadge: { backgroundColor: '#3B82F620', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  roleText: { color: '#3B82F6', fontWeight: 'bold', fontSize: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', marginBottom: 12, marginLeft: 8 },
  menuGroup: {
    backgroundColor: '#1E1E1E', borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: '#27272A', overflow: 'hidden',
  },
  menuButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#121212',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuTitle: { fontSize: 16, color: '#F8FAFC' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EF444420', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#EF444450', marginBottom: 24,
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },
  versionText: { textAlign: 'center', color: '#64748B', fontSize: 12 },
});
