import React, { useEffect, useState } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { StyleSheet, View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Linking, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  status: string;
  country: string;
  _count: {
    products: number;
    competitors: number;
  };
}

export default function IntelligenceScreen() {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/intelligence');
      const data = Array.isArray(response.data) ? response.data : response.data.data;
      setCompanies(data || []);
    } catch (error) {
      console.error('Failed to fetch intelligence data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanies();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '#10B981';
      case 'PENDING': return '#F59E0B';
      case 'FAILED': return '#EF4444';
      default: return '#3B82F6';
    }
  };

  const renderItem = ({ item }: { item: Company }) => (
    <TouchableOpacity style={styles.card} onPress={() => {
      if (item.website) Linking.openURL(item.website);
    }}>
      <View style={styles.cardHeader}>
        <Text style={styles.companyName}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.industry}>{item.industry || 'Unknown Industry'} • {item.country || 'Global'}</Text>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailBox}>
          <Text style={styles.detailNumber}>{item._count?.products || 0}</Text>
          <Text style={styles.detailLabel}>Products</Text>
        </View>
        <View style={styles.detailBox}>
          <Text style={styles.detailNumber}>{item._count?.competitors || 0}</Text>
          <Text style={styles.detailLabel}>Competitors</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Intelligence</Text>
            <Text style={styles.pageSubtitle}>Market and competitor data</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={() => {}}>
          <Text style={styles.newButtonText}>+ Track New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search market data..." 
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Feather name="filter" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Ionicons name="swap-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={companies}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bulb-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>No market intelligence data yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  newButton: {
    backgroundColor: '#2996A8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newButtonText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    height: '100%',
  },
  actionIconBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: { paddingHorizontal: 16, paddingBottom: 110 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  companyName: { fontSize: 18, fontWeight: 'bold', color: colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  industry: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  cardDetails: { flexDirection: 'row', gap: 16 },
  detailBox: { backgroundColor: colors.background, padding: 12, borderRadius: 12, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  detailNumber: { fontSize: 18, fontWeight: 'bold', color: colors.tint, marginBottom: 4 },
  detailLabel: { fontSize: 12, color: colors.textSecondary },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { color: colors.textSecondary, marginTop: 16, fontSize: 16 },
});
