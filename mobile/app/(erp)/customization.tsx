import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, FlatList, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import api from '../../lib/api';

// Custom Select Component for Dropdowns
const CustomSelect = ({ label, description, options, value, onValueChange, colors }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const styles = getStyles(colors);
  const selectedOption = options.find((o: any) => o.value === value) || options[0];

  return (
    <View style={styles.controlContainer}>
      <View style={styles.controlInfo}>
        <Text style={[styles.controlLabel, { color: colors.text }]}>{label}</Text>
        {description && <Text style={[styles.controlDesc, { color: colors.textSecondary }]}>{description}</Text>}
      </View>
      <TouchableOpacity style={[styles.selectButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setModalVisible(true)}>
        <Text style={[styles.selectButtonText, { color: colors.text }]}>{selectedOption?.label}</Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, { borderBottomColor: colors.border }, value === item.value && { backgroundColor: colors.background }]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, { color: colors.textSecondary }, value === item.value && { color: colors.tint, fontWeight: 'bold' }]}>
                    {item.label}
                  </Text>
                  {value === item.value && <Ionicons name="checkmark" size={20} color={colors.tint} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Custom Switch Component
const CustomSwitch = ({ label, description, value, onValueChange, colors }: any) => {
  const styles = getStyles(colors);
  return (
    <View style={[styles.controlContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
      <View style={[styles.controlInfo, { flex: 1, paddingRight: 16 }]}>
        <Text style={[styles.controlLabel, { color: colors.text }]}>{label}</Text>
        {description && <Text style={[styles.controlDesc, { color: colors.textSecondary }]}>{description}</Text>}
      </View>
      <Switch 
        value={value} 
        onValueChange={onValueChange} 
        trackColor={{ false: colors.border, true: colors.tint }}
        thumbColor={colors.text}
      />
    </View>
  );
};

export default function CustomizationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);

  const [initialPrefs, setInitialPrefs] = useState<any>({});
  const [prefs, setPrefs] = useState({
    fontFamily: 'inter',
    fontSize: 'medium',
    tableDensity: 'comfortable',
    tableWidth: 'fit',
    theme: 'system',
    accentColor: 'blue',
    roundedCorners: 'medium',
    animations: true,
    reduceMotion: false,
    highContrast: false,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setHasChanges(JSON.stringify(prefs) !== JSON.stringify(initialPrefs));
  }, [prefs, initialPrefs]);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      if (user?.id) {
        const res = await api.get('/auth/me');
        if (res.data?.data?.preferences) {
          const apiPrefs = { ...prefs, ...res.data.data.preferences };
          setPrefs(apiPrefs);
          setInitialPrefs(apiPrefs);
          return;
        }
      }
      
      const font = await AsyncStorage.getItem('app-font');
      const size = await AsyncStorage.getItem('app-font-size');
      const density = await AsyncStorage.getItem('app-table-density');
      const width = await AsyncStorage.getItem('app-table-layout');
      const theme = await AsyncStorage.getItem('app-theme');
      
      const localPrefs = {
        ...prefs,
        fontFamily: font || 'inter',
        fontSize: size || 'medium',
        tableDensity: density || 'comfortable',
        tableWidth: width || 'fit',
        theme: theme || 'system'
      };
      setPrefs(localPrefs);
      setInitialPrefs(localPrefs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/users/preferences', prefs);

      await AsyncStorage.setItem('app-font', prefs.fontFamily);
      await AsyncStorage.setItem('app-font-size', prefs.fontSize);
      await AsyncStorage.setItem('app-table-density', prefs.tableDensity);
      await AsyncStorage.setItem('app-table-layout', prefs.tableWidth);
      await setThemeMode(prefs.theme as any);
      
      setInitialPrefs(prefs);
      Alert.alert("Success", "Preferences saved globally to your profile!");
    } catch (e) {
      Alert.alert("Error", "Failed to save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrefs(initialPrefs);
  };

  const previewFontMap: any = { xs: 12, small: 14, medium: 16, large: 18, xl: 20 };
  const previewFontSize = previewFontMap[prefs.fontSize] || 16;
  const previewPadding = prefs.tableDensity === 'compact' ? 8 : prefs.tableDensity === 'comfortable' ? 12 : 16;
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.surface }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Customization</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Personalize your ERP experience</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* PREVIEW */}
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.groupHeader}>
            <Ionicons name="eye-outline" size={20} color={colors.tint} />
            <Text style={[styles.groupTitle, { color: colors.text }]}>Live Preview</Text>
          </View>
          <View style={[styles.previewBox, { backgroundColor: colors.background, borderColor: colors.border }, prefs.highContrast && { borderColor: colors.text, borderWidth: 2 }]}>
            <Text style={{ fontSize: previewFontSize, color: colors.text, marginBottom: 8, fontWeight: 'bold' }}>
              Sample Dashboard
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <View style={[styles.previewButton, { backgroundColor: prefs.accentColor === 'purple' ? '#9333EA' : prefs.accentColor === 'green' ? '#10B981' : prefs.accentColor === 'orange' ? '#F59E0B' : '#3B82F6', borderRadius: prefs.roundedCorners === 'large' ? 24 : prefs.roundedCorners === 'small' ? 4 : 8 }]}>
                <Text style={{ color: '#fff', fontSize: previewFontSize * 0.8, fontWeight: '600' }}>Primary Action</Text>
              </View>
            </View>
            <View style={{ backgroundColor: colors.surface, borderRadius: 8, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, padding: previewPadding }}>
                <Text style={{ color: colors.textSecondary, fontSize: previewFontSize * 0.85, flex: 1, fontWeight: '600' }}>ID</Text>
                <Text style={{ color: colors.textSecondary, fontSize: previewFontSize * 0.85, flex: 2, fontWeight: '600' }}>Customer</Text>
              </View>
              <View style={{ flexDirection: 'row', padding: previewPadding }}>
                <Text style={{ color: colors.text, fontSize: previewFontSize * 0.9, flex: 1 }}>#1042</Text>
                <Text style={{ color: colors.text, fontSize: previewFontSize * 0.9, flex: 2 }}>Acme Corp</Text>
              </View>
            </View>
          </View>
        </View>

        {/* DISPLAY */}
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.groupHeader}>
            <Ionicons name="desktop-outline" size={20} color={colors.tint} />
            <Text style={[styles.groupTitle, { color: colors.text }]}>Display</Text>
          </View>
          <CustomSelect
            label="Font Family"
            description="Choose the font used throughout the ERP."
            value={prefs.fontFamily}
            onValueChange={(val: string) => setPrefs(p => ({ ...p, fontFamily: val }))}
            options={[
              { label: 'Inter (Default)', value: 'inter' },
              { label: 'Roboto', value: 'roboto' },
              { label: 'SF Pro', value: 'sfpro' },
              { label: 'Poppins', value: 'poppins' }
            ]}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <CustomSelect
            label="Font Size"
            value={prefs.fontSize}
            onValueChange={(val: string) => setPrefs(p => ({ ...p, fontSize: val }))}
            options={[
              { label: 'Small', value: 'small' },
              { label: 'Medium (Default)', value: 'medium' },
              { label: 'Large', value: 'large' },
              { label: 'Extra Large', value: 'xl' }
            ]}
            colors={colors}
          />
        </View>

        {/* TABLE PREFERENCES */}
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.groupHeader}>
            <Ionicons name="grid-outline" size={20} color={colors.tint} />
            <Text style={[styles.groupTitle, { color: colors.text }]}>Table Preferences</Text>
          </View>
          <CustomSelect
            label="Table Density"
            description="Changes row height across every ERP table."
            value={prefs.tableDensity}
            onValueChange={(val: string) => setPrefs(p => ({ ...p, tableDensity: val }))}
            options={[
              { label: 'Compact (Shows maximum rows)', value: 'compact' },
              { label: 'Comfortable (Balanced)', value: 'comfortable' },
              { label: 'Spacious (Easier to read)', value: 'spacious' }
            ]}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <CustomSelect
            label="Table Width"
            description="Controls how table columns are displayed."
            value={prefs.tableWidth}
            onValueChange={(val: string) => setPrefs(p => ({ ...p, tableWidth: val }))}
            options={[
              { label: 'Fit Content', value: 'fit' },
              { label: 'Fill Screen', value: 'fill' },
              { label: 'Auto', value: 'auto' }
            ]}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={[styles.controlContainer, { marginBottom: 0 }]}>
            <View style={styles.controlInfo}>
              <Text style={[styles.controlLabel, { color: colors.text }]}>Column Visibility</Text>
              <Text style={[styles.controlDesc, { color: colors.textSecondary }]}>Open the enterprise column manager. Users can hide, show, pin, and reorder columns per module.</Text>
            </View>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.background }]} onPress={() => Alert.alert('Column Manager', 'Enterprise column manager will open here in a future update.')}>
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Customize Columns</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* APPEARANCE */}
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.groupHeader}>
            <Ionicons name="color-palette-outline" size={20} color={colors.tint} />
            <Text style={[styles.groupTitle, { color: colors.text }]}>Appearance</Text>
          </View>
          <CustomSelect
            label="Theme"
            value={prefs.theme}
            onValueChange={(val: string) => setPrefs(p => ({ ...p, theme: val }))}
            options={[
              { label: 'Dark', value: 'dark' },
              { label: 'Light', value: 'light' },
              { label: 'System Default', value: 'system' }
            ]}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <CustomSelect
            label="Accent Color"
            value={prefs.accentColor}
            onValueChange={(val: string) => setPrefs(p => ({ ...p, accentColor: val }))}
            options={[
              { label: 'Blue', value: 'blue' },
              { label: 'Purple', value: 'purple' },
              { label: 'Green', value: 'green' },
              { label: 'Orange', value: 'orange' }
            ]}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <CustomSelect
            label="Rounded Corners"
            value={prefs.roundedCorners}
            onValueChange={(val: string) => setPrefs(p => ({ ...p, roundedCorners: val }))}
            options={[
              { label: 'Small', value: 'small' },
              { label: 'Medium', value: 'medium' },
              { label: 'Large', value: 'large' }
            ]}
            colors={colors}
          />
        </View>

        {/* ACCESSIBILITY */}
        <View style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.groupHeader}>
            <Ionicons name="accessibility-outline" size={20} color={colors.tint} />
            <Text style={[styles.groupTitle, { color: colors.text }]}>Accessibility</Text>
          </View>
          <CustomSwitch
            label="Animations"
            value={prefs.animations}
            onValueChange={(val: boolean) => setPrefs(p => ({ ...p, animations: val }))}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <CustomSwitch
            label="Reduce Motion"
            value={prefs.reduceMotion}
            onValueChange={(val: boolean) => setPrefs(p => ({ ...p, reduceMotion: val }))}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <CustomSwitch
            label="High Contrast"
            value={prefs.highContrast}
            onValueChange={(val: boolean) => setPrefs(p => ({ ...p, highContrast: val }))}
            colors={colors}
          />
        </View>
        
      </ScrollView>

      {/* STICKY SAVE BAR */}
      {hasChanges && (
        <View style={[styles.stickyFooter, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} onPress={handleReset}>
            <Text style={[styles.resetBtnText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.tint }]} onPress={handleSave} disabled={isSaving}>
            <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Preferences'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  
  // Group Cards
  groupCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Controls
  controlContainer: {
    marginBottom: 12,
  },
  controlInfo: {
    marginBottom: 8,
  },
  controlLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  controlDesc: {
    fontSize: 13,
    marginTop: 4,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  selectButtonText: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Preview
  previewBox: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  previewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalOptionSelected: {
  },
  modalOptionText: {
    fontSize: 16,
  },
  
  // Sticky Footer
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  resetBtnText: {
    fontWeight: '600',
    fontSize: 15,
  },
  saveBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 15,
  }
});
