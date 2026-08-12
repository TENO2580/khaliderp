import React, { useState, useCallback } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { StyleSheet, View, FlatList, ActivityIndicator, TouchableOpacity, InteractionManager, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getCachedData, setCachedData } from '../../../lib/cache';
import { formatDate } from '../../../lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  module: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen() {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  const [notifications, setNotifications] = useState<Notification[]>(getCachedData('notifications') || []);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(!getCachedData('notifications'));
  const [isInteracting, setIsInteracting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=100');
      const data = response.data.data || response.data || [];
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      setCachedData('notifications', list);
      setUnreadCount(response.data.pagination?.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsInteracting(false);
      fetchNotifications();
    });
  }, []));

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications', { action: 'markAllRead' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#EF4444';
      case 'HIGH': return '#F59E0B';
      case 'NORMAL': return '#2996A8';
      case 'LOW': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getModuleIcon = (module: string): any => {
    switch (module) {
      case 'SALES': return 'cart-outline';
      case 'INVENTORY': return 'cube-outline';
      case 'PRODUCTION': return 'construct-outline';
      case 'PURCHASE': return 'bus-outline';
      case 'EXPENSES': return 'receipt-outline';
      case 'CUSTOMERS': return 'people-outline';
      case 'EMPLOYEES': return 'person-outline';
      default: return 'notifications-outline';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={[styles.notifCard, !item.isRead && styles.unreadCard]}>
      <View style={[styles.iconCircle, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
        <Ionicons name={getModuleIcon(item.module)} size={18} color={getPriorityColor(item.priority)} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={[styles.notifTitle, !item.isRead && { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
        <View style={styles.notifMeta}>
          <View style={[styles.moduleBadge, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
            <Text style={[styles.moduleBadgeText, { color: getPriorityColor(item.priority) }]}>{item.module}</Text>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Notifications</Text>
            <Text style={styles.pageSubtitle}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</Text>
          </View>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isInteracting || (loading && notifications.length === 0) ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2996A8" /></View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.border} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2996A8" />}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4, marginLeft: -4 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  markReadBtn: { backgroundColor: '#2996A8', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  markReadText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  notifCard: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: colors.border, gap: 12,
  },
  unreadCard: { borderColor: '#2996A830', backgroundColor: colors.surface },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, flex: 1, marginRight: 8 },
  notifTime: { fontSize: 11, color: colors.textSecondary },
  notifMessage: { fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  notifMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moduleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  moduleBadgeText: { fontSize: 10, fontWeight: 'bold' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2996A8' },
});
