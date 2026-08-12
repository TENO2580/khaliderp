import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { useAuthStore } from '../../../store/authStore';
import { useThemeStore } from '../../../store/themeStore';
import { Ionicons } from '@expo/vector-icons';
import { ROLE_LABELS } from '../../../lib/constants';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { getColors, themeMode, setThemeMode } = useThemeStore();
  const colors = getColors();
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

  const toggleTheme = () => {
    if (themeMode === 'system') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('light');
    else setThemeMode('system');
  };

  const getThemeTitle = () => {
    if (themeMode === 'system') return 'Theme (System)';
    if (themeMode === 'dark') return 'Theme (Dark)';
    return 'Theme (Light)';
  };

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
        <MenuButton icon="options-outline" title="Customization" onPress={() => router.push('/customization')} />
        <MenuButton icon={themeMode === 'light' ? "sunny-outline" : "moon-outline"} title={getThemeTitle()} onPress={toggleTheme} />
        <MenuButton icon="language-outline" title="Language" />
        <MenuButton icon="information-circle-outline" title="About Tripidio" />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Tripidio ERP v1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
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
  versionText: { textAlign: 'center', color: colors.textSecondary, fontSize: 12 },
});
