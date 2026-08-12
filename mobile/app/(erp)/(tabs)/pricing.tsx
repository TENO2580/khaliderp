import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getCachedData, setCachedData } from '../../../lib/cache';

export default function PricingScreen() {
  const [profile, setProfile] = useState<any>(getCachedData('pricing') || null);
  const [loading, setLoading] = useState(!getCachedData('pricing'));
  const [isInteracting, setIsInteracting] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const res = await api.get('/pricing');
      setProfile(res.data.data);
      setCachedData('pricing', res.data.data);
    } catch (error) {
      console.error('Failed to fetch pricing', error);
      Alert.alert('Error', 'Failed to load pricing data');
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

  const handleBaseCostChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value === '' ? '' : Number(value) });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/pricing', profile);
      setProfile(res.data.data);
      Alert.alert('Success', 'Pricing profile updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  const totalCostPerKg = profile ? 
    (Number(profile.waxCost) || 0) + 
    (Number(profile.otherMaterials) || 0) + 
    (Number(profile.labourCost) || 0) + 
    (Number(profile.electricityCost) || 0) + 
    (Number(profile.energyCost) || 0) + 
    (Number(profile.transportCost) || 0) : 0;

  const sellingPricePerKg = profile ? (Number(profile.sellingPrice) || 0) : 0;
  const profitMarginPerKg = sellingPricePerKg - totalCostPerKg;
  const profitMarginPercent = sellingPricePerKg > 0 ? (profitMarginPerKg / sellingPricePerKg) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#9CA3AF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Pricing Engine</Text>
            <Text style={styles.pageSubtitle}>1 KG Unit Economics</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {isInteracting || loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#9CA3AF" /></View>
        ) : !profile ? (
          <View style={styles.center}><Text style={{ color: '#94A3B8' }}>Failed to load pricing.</Text></View>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Base Costs (₹)</Text>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Wax Cost</Text>
                <TextInput style={styles.input} value={profile.waxCost?.toString()} keyboardType="numeric" onChangeText={(t) => handleBaseCostChange('waxCost', t)} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Other Materials</Text>
                <TextInput style={styles.input} value={profile.otherMaterials?.toString()} keyboardType="numeric" onChangeText={(t) => handleBaseCostChange('otherMaterials', t)} />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Labour Cost</Text>
                <TextInput style={styles.input} value={profile.labourCost?.toString()} keyboardType="numeric" onChangeText={(t) => handleBaseCostChange('labourCost', t)} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Electricity</Text>
                <TextInput style={styles.input} value={profile.electricityCost?.toString()} keyboardType="numeric" onChangeText={(t) => handleBaseCostChange('electricityCost', t)} />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Energy (Gas)</Text>
                <TextInput style={styles.input} value={profile.energyCost?.toString()} keyboardType="numeric" onChangeText={(t) => handleBaseCostChange('energyCost', t)} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Transport</Text>
                <TextInput style={styles.input} value={profile.transportCost?.toString()} keyboardType="numeric" onChangeText={(t) => handleBaseCostChange('transportCost', t)} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Packaging Overhead (₹/KG)</Text>
              <TextInput style={styles.input} value={profile.packagingOverhead?.toString()} keyboardType="numeric" onChangeText={(t) => handleBaseCostChange('packagingOverhead', t)} />
            </View>

          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>1 KG Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Prod Cost/KG</Text>
              <Text style={styles.summaryValue}>₹{totalCostPerKg.toFixed(2)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Selling Price/KG</Text>
              <TextInput 
                style={styles.summaryInput} 
                value={profile.sellingPrice?.toString()} 
                keyboardType="numeric" 
                onChangeText={(t) => handleBaseCostChange('sellingPrice', t)} 
              />
            </View>
            
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#27272A', paddingTop: 12, marginTop: 12 }]}>
              <Text style={[styles.summaryLabel, { color: '#F8FAFC', fontWeight: 'bold' }]}>Profit Margin/KG</Text>
              <Text style={[styles.summaryValue, { color: profitMarginPerKg >= 0 ? '#10B981' : '#EF4444' }]}>
                ₹{profitMarginPerKg.toFixed(2)} ({profitMarginPercent.toFixed(2)}%)
              </Text>
            </View>
          </View>

          {profile.caseVariants && profile.caseVariants.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Case Variants Preview</Text>
              {profile.caseVariants.map((v: any, idx: number) => {
                const effectiveProdCostPerKg = v.prodCostPerKg !== null && v.prodCostPerKg !== undefined ? Number(v.prodCostPerKg) : (totalCostPerKg + (Number(profile.packagingOverhead) || 0));
                const totalCaseCost = Number(v.weightKg) * effectiveProdCostPerKg;
                const margin = Number(v.sellingPrice) - totalCaseCost;
                return (
                  <View key={idx} style={styles.variantItem}>
                    <View style={styles.variantHeader}>
                      <Text style={styles.variantName}>{v.name}</Text>
                      <Text style={styles.variantWeight}>{v.weightKg} KG</Text>
                    </View>
                    <View style={styles.variantDetails}>
                      <Text style={styles.variantDetailText}>Cost: ₹{totalCaseCost.toFixed(2)}</Text>
                      <Text style={styles.variantDetailText}>Sell: ₹{v.sellingPrice}</Text>
                      <Text style={[styles.variantDetailText, { color: margin >= 0 ? '#10B981' : '#EF4444', fontWeight: 'bold' }]}>
                        Margin: ₹{margin.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4, marginLeft: -4 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
  pageSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  saveBtn: { backgroundColor: '#2996A8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 14 },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  
  card: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#27272A' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 16 },
  
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#121212', borderRadius: 12, padding: 12, color: '#F8FAFC', fontSize: 16, borderWidth: 1, borderColor: '#27272A' },
  
  summaryCard: { backgroundColor: '#1E1E1E', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#0EA5E9' },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#0EA5E9', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: '#94A3B8' },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#F8FAFC' },
  summaryInput: { backgroundColor: '#121212', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#10B981', fontSize: 16, fontWeight: 'bold', borderWidth: 1, borderColor: '#27272A', minWidth: 100, textAlign: 'right' },
  
  variantItem: { backgroundColor: '#121212', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#27272A' },
  variantHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  variantName: { fontSize: 14, fontWeight: 'bold', color: '#F8FAFC' },
  variantWeight: { fontSize: 12, color: '#94A3B8' },
  variantDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  variantDetailText: { fontSize: 12, color: '#94A3B8' }
});
