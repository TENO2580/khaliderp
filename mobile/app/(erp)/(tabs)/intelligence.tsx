import React, { useEffect, useState } from 'react';
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
        <ActivityIndicator size="large" color="#9CA3AF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#9CA3AF" />
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
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search market data..." 
            placeholderTextColor="#64748B"
          />
        </View>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Feather name="filter" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionIconBtn}>
          <Ionicons name="swap-vertical" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={companies}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bulb-outline" size={48} color="#475569" />
            <Text style={styles.emptyStateText}>No market intelligence data yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
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
    color: '#F8FAFC',
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  newButton: {
    backgroundColor: '#2996A8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newButtonText: {
    color: '#F8FAFC',
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
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    height: '100%',
  },
  actionIconBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: { paddingHorizontal: 16, paddingBottom: 110 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#27272A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  companyName: { fontSize: 18, fontWeight: 'bold', color: '#F8FAFC', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  industry: { fontSize: 14, color: '#94A3B8', marginBottom: 16 },
  cardDetails: { flexDirection: 'row', gap: 16 },
  detailBox: { backgroundColor: '#121212', padding: 12, borderRadius: 12, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#27272A' },
  detailNumber: { fontSize: 18, fontWeight: 'bold', color: '#3B82F6', marginBottom: 4 },
  detailLabel: { fontSize: 12, color: '#94A3B8' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyStateText: { color: '#94A3B8', marginTop: 16, fontSize: 16 },
});
