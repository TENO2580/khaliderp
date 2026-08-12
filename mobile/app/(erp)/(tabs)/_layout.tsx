import React from 'react';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, ScrollView, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { 
  Home, PieChart, Bell, UserCircle, Users, 
  ShoppingCart, Archive, Bus, Settings, 
  Search, TrendingUp, Sparkles, Package, LayoutGrid
} from 'lucide-react-native';
import { useAuthStore } from '../../../store/authStore';
import { NAV_ITEMS, hasPermission } from '../../../lib/constants';

function getLucideIcon(iconName: string, color: string) {
  switch(iconName) {
    case 'home-outline': return <Home size={20} color={color} strokeWidth={2.5} />;
    case 'pie-chart-outline': return <PieChart size={20} color={color} strokeWidth={2.5} />;
    case 'notifications-outline': return <Bell size={20} color={color} strokeWidth={2.5} />;
    case 'person-circle-outline': return <UserCircle size={20} color={color} strokeWidth={2.5} />;
    case 'people-outline': return <Users size={20} color={color} strokeWidth={2.5} />;
    case 'cart-outline': return <ShoppingCart size={20} color={color} strokeWidth={2.5} />;
    case 'archive-outline': return <Archive size={20} color={color} strokeWidth={2.5} />;
    case 'bus-outline': return <Bus size={20} color={color} strokeWidth={2.5} />;
    case 'construct-outline': return <Settings size={20} color={color} strokeWidth={2.5} />;
    case 'receipt-outline': return <Search size={20} color={color} strokeWidth={2.5} />;
    case 'bar-chart-outline': return <TrendingUp size={20} color={color} strokeWidth={2.5} />;
    case 'person-outline': return <Users size={20} color={color} strokeWidth={2.5} />;
    case 'stats-chart-outline': return <TrendingUp size={20} color={color} strokeWidth={2.5} />;
    case 'bulb-outline': return <Sparkles size={20} color={color} strokeWidth={2.5} />;
    case 'settings-outline': return <Settings size={20} color={color} strokeWidth={2.5} />;
    case 'grid-outline': return <LayoutGrid size={20} color={color} strokeWidth={2.5} />;
    default: return <Package size={20} color={color} strokeWidth={2.5} />;
  }
}

function CustomTabBar() {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  // Build the array of tabs
  const coreTabs = [
    { title: 'Dashboard', href: '/(erp)', icon: 'grid-outline' },
  ];
  
  const authorizedModules = NAV_ITEMS.filter(item => 
    item.href !== '/(erp)' && (!item.permission || hasPermission(user.role, item.permission))
  );

  const endTabs = [
    { title: 'Analytics', href: '/(erp)/analytics', icon: 'pie-chart-outline' },
    { title: 'Alerts', href: '/(erp)/notifications', icon: 'notifications-outline' },
    { title: 'Profile', href: '/(erp)/profile', icon: 'person-circle-outline' },
  ];

  const allTabs = [...coreTabs, ...authorizedModules, ...endTabs];

  return (
    <View style={styles.tabBarWrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {allTabs.map(tab => {
          const pathSegment = tab.href.split('/').pop() || '';
          const currentSegment = pathname.split('/').pop() || '';
          const isActive = pathSegment === '(erp)' 
            ? (pathname === '/' || pathname === '') 
            : currentSegment === pathSegment;

          return (
            <TouchableOpacity 
              key={tab.title} 
              style={styles.tabButton}
              onPress={() => router.navigate(tab.href as any)}
            >
              <View style={isActive ? styles.activeIconBg : styles.inactiveIconBg}>
                {getLucideIcon(tab.icon, isActive ? '#2996A8' : '#94A3B8')}
              </View>
              <Text style={[styles.tabLabel, { color: isActive ? '#2996A8' : '#94A3B8' }]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen name="employees" />
      <Tabs.Screen name="sales" />
      <Tabs.Screen name="batches" />
      <Tabs.Screen name="expenses" />
      <Tabs.Screen name="production" />
      <Tabs.Screen name="purchase" />
      <Tabs.Screen name="reports" />
      <Tabs.Screen name="intelligence" />
      <Tabs.Screen name="pricing" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 20,
    height: 56,
    backgroundColor: '#1E1E1E', // Dark grey from screenshot
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    height: '100%',
    minWidth: 72,
  },
  activeIconBg: {
    backgroundColor: 'transparent',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  inactiveIconBg: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  }
});
