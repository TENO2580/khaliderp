import React, { useEffect, useState, useCallback } from 'react';
import { useThemeStore } from '../../../store/themeStore';
import { StyleSheet, View, ActivityIndicator, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, InteractionManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import api from '../../../lib/api';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getCachedData, setCachedData } from '../../../lib/cache';

export default function PricingScreen() {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
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

  const handleVariantChange = (index: number, field: string, value: string) => {
    const updatedVariants = [...profile.caseVariants];
    updatedVariants[index] = { 
      ...updatedVariants[index], 
      [field]: value === '' ? null : Number(value) 
    };
    setProfile({ ...profile, caseVariants: updatedVariants });
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
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
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
          <View style={styles.center}><ActivityIndicator size="large" color={colors.textSecondary} /></View>
        ) : !profile ? (
          <View style={styles.center}><Text style={{ color: colors.textSecondary }}>Failed to load pricing.</Text></View>
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
            
            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 }]}>
              <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: 'bold' }]}>Profit Margin/KG</Text>
              <Text style={[styles.summaryValue, { color: profitMarginPerKg >= 0 ? '#10B981' : colors.danger }]}>
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
                    </View>
                    
                    <View style={styles.variantFormRow}>
                      <View style={[styles.variantFormGroup, { flex: 1 }]}>
                        <Text style={styles.variantLabel}>Weight (KG)</Text>
                        <TextInput 
                          style={styles.variantInput} 
                          value={v.weightKg?.toString()} 
                          keyboardType="numeric" 
                          onChangeText={(t) => handleVariantChange(idx, 'weightKg', t)} 
                        />
                      </View>
                      <View style={[styles.variantFormGroup, { flex: 1.2 }]}>
                        <Text style={styles.variantLabel}>Prod Cost/KG</Text>
                        <TextInput 
                          style={styles.variantInput} 
                          value={v.prodCostPerKg ? v.prodCostPerKg.toString() : ''} 
                          placeholder={effectiveProdCostPerKg.toFixed(2)} 
                          placeholderTextColor={colors.textSecondary} 
                          keyboardType="numeric" 
                          onChangeText={(t) => handleVariantChange(idx, 'prodCostPerKg', t)} 
                        />
                      </View>
                      <View style={[styles.variantFormGroup, { flex: 1 }]}>
                        <Text style={styles.variantLabel}>Sell Price</Text>
                        <TextInput 
                          style={styles.variantInput} 
                          value={v.sellingPrice?.toString()} 
                          keyboardType="numeric" 
                          onChangeText={(t) => handleVariantChange(idx, 'sellingPrice', t)} 
                        />
                      </View>
                    </View>

                    <View style={[styles.variantDetails, { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }]}>
                      <Text style={styles.variantDetailText}>Cost: ₹{totalCaseCost.toFixed(2)}</Text>
                      <Text style={[styles.variantDetailText, { color: margin >= 0 ? '#10B981' : colors.danger, fontWeight: 'bold' }]}>
                        Margin: ₹{margin.toFixed(2)} {v.sellingPrice > 0 ? `(${(margin / v.sellingPrice * 100).toFixed(2)}%)` : ''}
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

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4, marginLeft: -4 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  pageSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  saveBtn: { backgroundColor: '#2996A8', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: colors.text, fontWeight: 'bold', fontSize: 14 },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  
  formGroup: { marginBottom: 16 },
  formRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  label: { fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: 12, color: colors.text, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  
  summaryCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#0EA5E9' },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#0EA5E9', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  summaryInput: { backgroundColor: colors.background, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, color: '#10B981', fontSize: 16, fontWeight: 'bold', borderWidth: 1, borderColor: colors.border, minWidth: 100, textAlign: 'right' },
  
  variantItem: { backgroundColor: colors.background, borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  variantHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  variantName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  variantWeight: { fontSize: 12, color: colors.textSecondary },
  variantFormRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  variantFormGroup: { gap: 4 },
  variantLabel: { fontSize: 10, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase' },
  variantInput: { backgroundColor: colors.surface, borderRadius: 8, padding: 8, color: colors.text, fontSize: 14, borderWidth: 1, borderColor: colors.border },
  variantDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  variantDetailText: { fontSize: 13, color: colors.textSecondary }
});
