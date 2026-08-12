import React, { useState, useCallback } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { StyleSheet, View, ScrollView, ActivityIndicator, TouchableOpacity, InteractionManager, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { DataTable, Column } from '../../../components/DataTable';
import { getCachedData, setCachedData } from '../../../lib/cache';
import { formatDate } from '../../../lib/utils';

const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Report' },
  { id: 'customer', label: 'Customer Report' },
  { id: 'profit', label: 'Profit & Margin' },
  { id: 'expense', label: 'Expense Report' },
  { id: 'inventory', label: 'Inventory Valuation' },
  { id: 'production', label: 'Production Report' },
  { id: 'gst', label: 'GST Audit Report' },
  { id: 'outstanding', label: 'Outstanding Receivables' },
];

export default function ReportsScreen() {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  const [activeReport, setActiveReport] = useState(REPORT_TYPES[0].id);
  const [reportData, setReportData] = useState<any>(getCachedData(`report_${activeReport}`) || null);
  const [loading, setLoading] = useState(!getCachedData(`report_${activeReport}`));
  const [isInteracting, setIsInteracting] = useState(true);
  const router = useRouter();

  const fetchReport = async (type: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/reports?type=${type}`);
      setReportData(response.data);
      setCachedData(`report_${type}`, response.data);
    } catch (error) {
      console.error('Failed to fetch reports', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsInteracting(false);
      if (!getCachedData(`report_${activeReport}`)) {
        fetchReport(activeReport);
      }
    });
  }, []));

  const handleTabChange = (type: string) => {
    setActiveReport(type);
    const cached = getCachedData(`report_${type}`);
    if (cached) {
      setReportData(cached);
    } else {
      setReportData(null);
      fetchReport(type);
    }
  };

  const getColumns = (): Column[] => {
    switch (activeReport) {
      case 'sales': return [
        { key: 'orderNumber', title: 'Order #', width: 120, render: (item) => <Text style={[styles.cellText, {color: '#2996A8', fontWeight: 'bold'}]}>{item.orderNumber}</Text> },
        { key: 'customer', title: 'Customer', width: 150, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]} numberOfLines={1}>{item.customer}</Text> },
        { key: 'date', title: 'Date', width: 100, render: (item) => <Text style={styles.cellText}>{formatDate(item.date)}</Text> },
        { key: 'amount', title: 'Amount', width: 100, render: (item) => <Text style={styles.cellText}>₹{item.amount?.toLocaleString()}</Text> },
        { key: 'paid', title: 'Paid', width: 100, render: (item) => <Text style={[styles.cellText, {color: '#10B981'}]}>₹{item.paid?.toLocaleString()}</Text> },
        { key: 'outstanding', title: 'Outstanding', width: 100, render: (item) => <Text style={[styles.cellText, {color: item.outstanding > 0 ? '#EF4444' : colors.textSecondary}]}>₹{item.outstanding?.toLocaleString()}</Text> },
        { key: 'status', title: 'Status', width: 100, render: (item) => <Text style={[styles.cellText, {fontSize: 12, fontWeight: 'bold'}]}>{item.status}</Text> },
      ];
      case 'customer': return [
        { key: 'name', title: 'Name', width: 150, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]} numberOfLines={1}>{item.name}</Text> },
        { key: 'phone', title: 'Phone', width: 120 },
        { key: 'type', title: 'Type', width: 100 },
        { key: 'totalOrders', title: 'Orders', width: 80 },
        { key: 'totalRevenue', title: 'Revenue', width: 100, render: (item) => <Text style={styles.cellText}>₹{item.totalRevenue?.toLocaleString()}</Text> },
      ];
      case 'profit': return [
        { key: 'metric', title: 'Metric', width: 150, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]}>{item.metric}</Text> },
        { key: 'value', title: 'Value', width: 150, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold', color: '#10B981'}]}>{typeof item.value === 'number' ? item.metric.includes('%') ? item.value.toFixed(2) + '%' : '₹' + item.value.toLocaleString() : item.value}</Text> },
      ];
      case 'expense': return [
        { key: 'category', title: 'Category', width: 150, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]}>{item.category}</Text> },
        { key: 'count', title: 'Tx Count', width: 100 },
        { key: 'amount', title: 'Total Amount', width: 120, render: (item) => <Text style={styles.cellText}>₹{item.amount?.toLocaleString()}</Text> },
        { key: 'percentage', title: '% of Total', width: 100, render: (item) => <Text style={styles.cellText}>{item.percentage?.toFixed(2)}%</Text> },
      ];
      case 'inventory': return [
        { key: 'type', title: 'Type', width: 120 },
        { key: 'name', title: 'Item Name', width: 150, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]} numberOfLines={1}>{item.name}</Text> },
        { key: 'stock', title: 'Stock', width: 80, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold', color: item.lowStock ? '#EF4444' : colors.text}]}>{item.stock}</Text> },
        { key: 'unitCost', title: 'Unit Cost', width: 100, render: (item) => <Text style={styles.cellText}>₹{item.unitCost?.toLocaleString()}</Text> },
        { key: 'totalValue', title: 'Total Value', width: 100, render: (item) => <Text style={styles.cellText}>₹{item.totalValue?.toLocaleString()}</Text> },
      ];
      case 'production': return [
        { key: 'productionNumber', title: 'Prod #', width: 120, render: (item) => <Text style={[styles.cellText, {color: '#2996A8', fontWeight: 'bold'}]}>{item.productionNumber}</Text> },
        { key: 'date', title: 'Date', width: 100, render: (item) => <Text style={styles.cellText}>{formatDate(item.date)}</Text> },
        { key: 'waxUsed', title: 'Wax Used', width: 100 },
        { key: 'quantityProduced', title: 'Produced', width: 100 },
        { key: 'totalCost', title: 'Total Cost', width: 100, render: (item) => <Text style={styles.cellText}>₹{item.totalCost?.toLocaleString()}</Text> },
      ];
      case 'gst': return [
        { key: 'invoiceNumber', title: 'Invoice #', width: 120, render: (item) => <Text style={[styles.cellText, {color: '#2996A8', fontWeight: 'bold'}]}>{item.invoiceNumber}</Text> },
        { key: 'customer', title: 'Customer', width: 150, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]} numberOfLines={1}>{item.customer}</Text> },
        { key: 'date', title: 'Date', width: 100, render: (item) => <Text style={styles.cellText}>{formatDate(item.date)}</Text> },
        { key: 'taxableAmount', title: 'Taxable Amt', width: 100, render: (item) => <Text style={styles.cellText}>₹{item.taxableAmount?.toLocaleString()}</Text> },
        { key: 'totalGst', title: 'Total GST', width: 100, render: (item) => <Text style={styles.cellText}>₹{item.totalGst?.toLocaleString()}</Text> },
        { key: 'totalAmount', title: 'Total', width: 100, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]}>₹{item.totalAmount?.toLocaleString()}</Text> },
      ];
      case 'outstanding': return [
        { key: 'name', title: 'Name', width: 150, render: (item) => <Text style={[styles.cellText, {fontWeight: 'bold'}]} numberOfLines={1}>{item.name}</Text> },
        { key: 'phone', title: 'Phone', width: 120 },
        { key: 'invoiceCount', title: 'Pending Inv', width: 100 },
        { key: 'outstanding', title: 'Outstanding', width: 120, render: (item) => <Text style={[styles.cellText, {color: colors.danger, fontWeight: 'bold'}]}>₹{item.outstanding?.toLocaleString()}</Text> },
      ];
      default: return [];
    }
  };

  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;
    const s = reportData.summary;
    const cards = [];

    const formatVal = (v: any, key: string) => {
      if (typeof v === 'number') {
        if (key.toLowerCase().includes('count') || key.toLowerCase().includes('totalproductions')) return v.toString();
        if (key.toLowerCase().includes('margin') || key.toLowerCase().includes('percentage')) return v.toFixed(2) + '%';
        return '₹' + v.toLocaleString();
      }
      return v;
    };

    const formatKey = (k: string) => {
      return k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    };

    for (const [key, value] of Object.entries(s)) {
      cards.push(
        <View key={key} style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{formatKey(key)}</Text>
          <Text style={styles.summaryValue}>{formatVal(value, key)}</Text>
        </View>
      );
    }

    return (
      <View style={styles.summaryContainer}>
        {cards}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Reports & Advanced Analytics</Text>
            <Text style={styles.pageSubtitle}>Comprehensive business reports powered by your live data</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={() => {}}>
          <Text style={styles.newButtonText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {REPORT_TYPES.map(tab => (
            <TouchableOpacity 
              key={tab.id}
              style={[styles.pill, activeReport === tab.id && styles.pillActive]}
              onPress={() => handleTabChange(tab.id)}
            >
              <Text style={[styles.pillText, activeReport === tab.id && styles.pillTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {!reportData && !loading && !isInteracting ? (
        <View style={styles.center}><Text style={{ color: colors.textSecondary }}>No data available for this report.</Text></View>
      ) : (
        <View style={styles.contentWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, paddingBottom: 16 }}>
            {renderSummaryCards()}
          </ScrollView>
          <View style={styles.tableWrapper}>
            <DataTable columns={getColumns()} data={reportData?.rows || []} showActions={false} isLoading={isInteracting || loading} />
          </View>
        </View>
      )}
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
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4, marginLeft: -4 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  newButton: { backgroundColor: '#2996A8', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  newButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  
  tabsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: '#2996A8',
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  pillTextActive: {
    color: '#fff',
  },
  
  contentWrapper: {
    flex: 1,
    paddingTop: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    minWidth: 140,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  
  tableWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  cellText: {
    color: colors.text,
    fontSize: 13,
  },
});
