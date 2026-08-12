import React from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { useAuthStore } from '../../../store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { ROLE_LABELS } from '../../../lib/constants';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
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

  const InfoRow = ({ icon, label, value }: any) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={18} color={colors.textSecondary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );

  const MenuButton = ({ icon, title, onPress }: any) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
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
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 8 },
  backBtn: { padding: 4, marginLeft: -4 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.tint,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  roleBadge: { backgroundColor: colors.tint + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  roleText: { color: colors.tint, fontWeight: 'bold', fontSize: 12 },
  
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 12, marginLeft: 8 },
  
  infoGroup: {
    backgroundColor: colors.surface, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
    borderBottomWidth: 1, borderBottomColor: colors.background,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  infoLabel: { fontSize: 14, color: colors.textSecondary, width: 80 },
  infoValue: { fontSize: 14, color: colors.text, fontWeight: '500', flex: 1, textAlign: 'right' },
  
  menuGroup: {
    backgroundColor: colors.surface, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  menuButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16,
    borderBottomWidth: 1, borderBottomColor: colors.background,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuTitle: { fontSize: 16, color: colors.text },
  
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.danger + '20', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.danger + '50', marginBottom: 24,
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: colors.danger },
});
