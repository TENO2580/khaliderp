import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, TouchableOpacity, InteractionManager, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getCachedData, setCachedData } from '../../../lib/cache';

export default function AnalyticsScreen() {
  const [data, setData] = useState<any>(getCachedData('analytics') || null);
  const [loading, setLoading] = useState(!getCachedData('analytics'));
  const [isInteracting, setIsInteracting] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setData(response.data);
      setCachedData('analytics', response.data);
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsInteracting(false);
      fetchData();
    });
  }, []));

  const formatCurrency = (n: number) => '₹' + (n || 0).toLocaleString();

  const kpis = data?.kpis;
  const charts = data?.charts;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Analytics</Text>
            <Text style={styles.pageSubtitle}>Live business intelligence</Text>
          </View>
        </View>
      </View>

      {isInteracting || loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2996A8" /></View>
      ) : !kpis ? (
        <View style={styles.center}><Text style={{ color: '#94A3B8' }}>Failed to load analytics.</Text></View>
      ) : (
        <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 110 }}>
          {/* KPI Summary */}
          <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
          <View style={styles.grid}>
            <KPICard title="Today's Sales" value={formatCurrency(kpis.todaysSales)} icon="cash-outline" color="#10B981" />
            <KPICard title="Today's Profit" value={formatCurrency(kpis.todaysProfit)} icon="trending-up-outline" color="#10B981" />
            <KPICard title="Monthly Sales" value={formatCurrency(kpis.monthlySales)} icon="bar-chart-outline" color="#2996A8" change={kpis.salesChange} />
            <KPICard title="Monthly Profit" value={formatCurrency(kpis.monthlyProfit)} icon="analytics-outline" color="#8B5CF6" />
            <KPICard title="Monthly Expenses" value={formatCurrency(kpis.monthlyExpenses)} icon="wallet-outline" color="#EF4444" change={kpis.expenseChange} />
            <KPICard title="Gross Margin" value={`${kpis.grossMargin}%`} icon="pie-chart-outline" color="#F59E0B" />
          </View>

          <Text style={styles.sectionTitle}>Operations</Text>
          <View style={styles.grid}>
            <KPICard title="Orders Pending" value={kpis.ordersPending} icon="time-outline" color="#F59E0B" />
            <KPICard title="Orders Delivered" value={kpis.ordersDelivered} icon="checkmark-circle-outline" color="#10B981" />
            <KPICard title="Total Customers" value={kpis.totalCustomers} icon="people-outline" color="#2996A8" />
            <KPICard title="Active Customers" value={kpis.activeCustomers} icon="person-outline" color="#10B981" />
            <KPICard title="Production Today" value={`${kpis.productionToday} KG`} icon="construct-outline" color="#8B5CF6" />
            <KPICard title="Prod. This Month" value={`${kpis.productionThisMonth} KG`} icon="hammer-outline" color="#EC4899" />
          </View>

          <Text style={styles.sectionTitle}>Inventory & Credit</Text>
          <View style={styles.grid}>
            <KPICard title="Wax Stock" value={`${kpis.currentWaxStock} KG`} icon="water-outline" color="#06B6D4" />
            <KPICard title="Finished Goods" value={`${kpis.finishedGoodsStock} KG`} icon="cube-outline" color="#EC4899" />
            <KPICard title="Inventory Value" value={formatCurrency(kpis.inventoryValue)} icon="pricetag-outline" color="#10B981" />
            <KPICard title="Outstanding Credit" value={formatCurrency(kpis.outstandingCredit)} icon="alert-circle-outline" color="#EF4444" />
          </View>

          {/* Charts Data as Tables */}
          {charts?.monthlySalesTrend && charts.monthlySalesTrend.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>6-Month Sales Trend</Text>
              <View style={styles.trendContainer}>
                {charts.monthlySalesTrend.map((item: any, idx: number) => (
                  <View key={idx} style={styles.trendRow}>
                    <Text style={styles.trendLabel}>{item.month}</Text>
                    <Text style={styles.trendValue}>{formatCurrency(item.sales)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {charts?.customerOrders && charts.customerOrders.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Top Customers by Revenue</Text>
              <View style={styles.trendContainer}>
                {charts.customerOrders.map((item: any, idx: number) => (
                  <View key={idx} style={styles.trendRow}>
                    <Text style={[styles.trendLabel, { flex: 2 }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.trendValue}>{formatCurrency(item.TotalSales)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {charts?.expenseBreakdown && charts.expenseBreakdown.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Expense Breakdown (This Month)</Text>
              <View style={styles.trendContainer}>
                {charts.expenseBreakdown.map((item: any, idx: number) => (
                  <View key={idx} style={styles.trendRow}>
                    <Text style={[styles.trendLabel, { flex: 2 }]} numberOfLines={1}>{item.category}</Text>
                    <Text style={styles.trendValue}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const KPICard = ({ title, value, icon, color, change }: any) => (
  <View style={styles.card}>
    <View style={[styles.iconWrapper, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
    {change !== undefined && change !== null && (
      <Text style={[styles.changeText, { color: change >= 0 ? '#10B981' : '#EF4444' }]}>
        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last month
      </Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4, marginLeft: -4 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
  pageSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  scrollContent: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 12, marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
  card: {
    width: '48%', backgroundColor: '#1E1E1E', borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#27272A',
  },
  iconWrapper: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  cardValue: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 2 },
  cardTitle: { fontSize: 11, color: '#94A3B8' },
  changeText: { fontSize: 10, marginTop: 4 },
  trendContainer: {
    backgroundColor: '#1E1E1E', borderRadius: 12, borderWidth: 1, borderColor: '#27272A',
    marginBottom: 12, overflow: 'hidden',
  },
  trendRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#27272A',
  },
  trendLabel: { color: '#94A3B8', fontSize: 13, flex: 1 },
  trendValue: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold' },
});
