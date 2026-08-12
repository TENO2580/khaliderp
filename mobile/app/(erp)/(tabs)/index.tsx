import React, { useEffect, useState, useRef } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, Animated, RefreshControl } from 'react-native';
import { Text } from '@/components/Themed';
import { useAuthStore } from '../../../store/authStore';
import { ROLE_LABELS, hasPermission, NAV_ITEMS } from '../../../lib/constants';
import { 
  Bell, Search, TrendingUp, AlertCircle, Clock, Package, 
  Users, ShoppingCart, Archive, Bus, Settings, Sparkles, CheckCircle2 
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import api from '../../../lib/api';

export default function PremiumDashboard() {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  const { user } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data.kpis);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (!user) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // 1. Header Section
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.profileSection}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Search color={colors.textSecondary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <View style={styles.notificationBadge} />
            <Bell color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statusRow}>
        <Text style={styles.statusText}>Tripidio ERP • {ROLE_LABELS[user.role]}</Text>
        <View style={styles.onlineStatus}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>
    </View>
  );

  // 2. Business Health KPIs
  const renderKPIs = () => (
    <Animated.View style={[styles.kpiGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>Today's Sales</Text>
        <Text style={styles.kpiValue}>₹{(stats?.todaysSales || 0).toLocaleString()}</Text>
        <View style={styles.kpiTrendRow}>
          <TrendingUp size={12} color="#22C55E" />
          <Text style={styles.kpiTrendSuccess}>+12.5%</Text>
        </View>
      </View>
      <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>Pending Orders</Text>
        <Text style={styles.kpiValue}>{stats?.ordersPending || 0}</Text>
        <View style={styles.kpiTrendRow}>
          <Clock size={12} color="#F59E0B" />
          <Text style={styles.kpiTrendWarning}>Action Needed</Text>
        </View>
      </View>
      <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>Finished Goods</Text>
        <Text style={styles.kpiValue}>{stats?.finishedGoodsStock || 0} KG</Text>
        <View style={styles.kpiTrendRow}>
          <Package size={12} color="#4F8CFF" />
          <Text style={styles.kpiTrendNeutral}>In Stock</Text>
        </View>
      </View>
      <View style={styles.kpiCard}>
        <Text style={styles.kpiLabel}>Outst. Credit</Text>
        <Text style={styles.kpiValue}>₹{(stats?.outstandingCredit || 0).toLocaleString()}</Text>
        <View style={styles.kpiTrendRow}>
          <AlertCircle size={12} color={colors.danger} />
          <Text style={styles.kpiTrendDanger}>Requires Follow-up</Text>
        </View>
      </View>
    </Animated.View>
  );

  // 3. Quick Actions
  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActionsScroll}>
        <TouchableOpacity style={styles.quickActionPill}>
          <Text style={styles.quickActionText}>+ New Sale</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionPill}>
          <Text style={styles.quickActionText}>+ Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionPill}>
          <Text style={styles.quickActionText}>+ Purchase</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionPill}>
          <Text style={styles.quickActionText}>+ Expense</Text>
        </TouchableOpacity>
        <View style={{ width: 24 }} />
      </ScrollView>
    </View>
  );

  // 4. AI Business Insights
  const renderAIInsights = () => (
    <View style={styles.section}>
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <Sparkles color="#7C5CFF" size={24} />
          <Text style={styles.aiTitle}>AI Business Insights</Text>
        </View>
        <View style={styles.aiContent}>
          <Text style={styles.aiText}>• Sales increased 14% this week compared to last week.</Text>
          <Text style={styles.aiText}>• 5 loyal customers haven't purchased for over 45 days.</Text>
          <Text style={styles.aiText}>• Profit margin dropped 2% due to rising raw material costs.</Text>
        </View>
        <View style={styles.aiActionBox}>
          <Text style={styles.aiActionLabel}>Suggested Action:</Text>
          <Text style={styles.aiActionText}>Follow up with inactive customers via SMS promotion.</Text>
        </View>
      </View>
    </View>
  );

  // 5. My Modules Grid
  const getLucideIcon = (iconName: string) => {
    switch(iconName) {
      case 'people-outline': return <Users size={28} color="#4F8CFF" />;
      case 'cart-outline': return <ShoppingCart size={28} color="#22C55E" />;
      case 'archive-outline': return <Archive size={28} color="#F59E0B" />;
      case 'bus-outline': return <Bus size={28} color="#7C5CFF" />;
      case 'construct-outline': return <Settings size={28} color="#EC4899" />;
      case 'receipt-outline': return <Search size={28} color={colors.danger} />;
      case 'bar-chart-outline': return <TrendingUp size={28} color="#14B8A6" />;
      case 'person-outline': return <Users size={28} color="#8B5CF6" />;
      case 'stats-chart-outline': return <TrendingUp size={28} color={colors.textSecondary} />;
      case 'bulb-outline': return <Sparkles size={28} color="#D946EF" />;
      case 'settings-outline': return <Settings size={28} color={colors.textSecondary} />;
      default: return <Package size={28} color="#4F8CFF" />;
    }
  };

  const renderModules = () => {
    const authorizedModules = NAV_ITEMS.filter(item => item.href !== '/(erp)' && (!item.permission || hasPermission(user.role, item.permission)));
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Modules</Text>
        <View style={styles.modulesGrid}>
          {authorizedModules.map(mod => (
            <TouchableOpacity 
              key={mod.title} 
              style={styles.moduleCard}
              onPress={() => router.push(mod.href as any)}
            >
              <View style={styles.moduleIconBox}>
                {getLucideIcon(mod.icon)}
              </View>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.moduleDesc} numberOfLines={1}>Manage {mod.title.toLowerCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 6. Recent Activity
  const renderActivity = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.timelineCard}>
        <View style={styles.timelineItem}>
          <CheckCircle2 size={16} color="#22C55E" />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>Invoice INV-001 Created</Text>
            <Text style={styles.timelineTime}>10 mins ago</Text>
          </View>
        </View>
        <View style={styles.timelineLine} />
        <View style={styles.timelineItem}>
          <CheckCircle2 size={16} color="#4F8CFF" />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>Customer Added</Text>
            <Text style={styles.timelineTime}>1 hour ago</Text>
          </View>
        </View>
        <View style={styles.timelineLine} />
        <View style={styles.timelineItem}>
          <CheckCircle2 size={16} color="#F59E0B" />
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>Production Completed</Text>
            <Text style={styles.timelineTime}>3 hours ago</Text>
          </View>
        </View>
      </View>
      <View style={{ height: 60 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F8CFF" />}
      >
        {renderHeader()}
        {renderKPIs()}
        {renderQuickActions()}
        {renderAIInsights()}
        {renderModules()}
        {renderActivity()}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4F8CFF',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#4F8CFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#4F8CFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    marginLeft: 16,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    zIndex: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  onlineText: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: 'bold',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  kpiTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiTrendSuccess: {
    fontSize: 12,
    color: '#22C55E',
    marginLeft: 4,
    fontWeight: '600',
  },
  kpiTrendWarning: {
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 4,
    fontWeight: '600',
  },
  kpiTrendDanger: {
    fontSize: 12,
    color: colors.danger,
    marginLeft: 4,
    fontWeight: '600',
  },
  kpiTrendNeutral: {
    fontSize: 12,
    color: '#4F8CFF',
    marginLeft: 4,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  quickActionsScroll: {
    paddingHorizontal: 24,
  },
  quickActionPill: {
    backgroundColor: '#4F8CFF15',
    borderWidth: 1,
    borderColor: '#4F8CFF40',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
  },
  quickActionText: {
    color: '#4F8CFF',
    fontWeight: '600',
    fontSize: 14,
  },
  aiCard: {
    marginHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#7C5CFF40',
    shadowColor: '#7C5CFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginLeft: 12,
  },
  aiContent: {
    marginBottom: 20,
  },
  aiText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  aiActionBox: {
    backgroundColor: '#7C5CFF15',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#7C5CFF',
  },
  aiActionLabel: {
    fontSize: 12,
    color: '#7C5CFF',
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  aiActionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  moduleIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  moduleDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timelineCard: {
    marginHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineContent: {
    marginLeft: 16,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.surface,
    marginLeft: 7,
    marginVertical: 4,
  }
});
