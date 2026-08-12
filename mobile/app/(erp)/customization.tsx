import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, FlatList, Alert } from 'react-native';
import { Text } from '@/components/Themed';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reusable Custom Select Component
const CustomSelect = ({ label, options, value, onValueChange }: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find((o: any) => o.value === value) || options[0];

  return (
    <View style={styles.selectContainer}>
      <Text style={styles.selectLabel}>{label}</Text>
      <TouchableOpacity 
        style={styles.selectButton} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectButtonText}>{selectedOption?.label}</Text>
        <Ionicons name="chevron-down" size={20} color="#94A3B8" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalOption, value === item.value && styles.modalOptionSelected]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, value === item.value && styles.modalOptionTextSelected]}>
                    {item.label}
                  </Text>
                  {value === item.value && <Ionicons name="checkmark" size={20} color="#3B82F6" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function CustomizationScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState({
    fontFamily: 'roboto',
    fontSize: 'medium',
    tableDensity: 'compact',
    tableWidth: 'auto'
  });

  useEffect(() => {
    // Load from AsyncStorage
    const loadPrefs = async () => {
      try {
        const font = await AsyncStorage.getItem('app-font');
        const size = await AsyncStorage.getItem('app-font-size');
        const density = await AsyncStorage.getItem('app-table-density');
        const width = await AsyncStorage.getItem('app-table-layout');
        
        setPrefs({
          fontFamily: font || 'roboto',
          fontSize: size || 'xl',
          tableDensity: density || 'compact',
          tableWidth: width || 'auto'
        });
      } catch (e) {
        console.error(e);
      }
    };
    loadPrefs();
  }, []);

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem('app-font', prefs.fontFamily);
      await AsyncStorage.setItem('app-font-size', prefs.fontSize);
      await AsyncStorage.setItem('app-table-density', prefs.tableDensity);
      await AsyncStorage.setItem('app-table-layout', prefs.tableWidth);
      
      Alert.alert("Success", "Preferences saved successfully!");
    } catch (e) {
      Alert.alert("Error", "Failed to save preferences.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customization</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollContent}>
        
        {/* Display Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Preferences</Text>
          <Text style={styles.sectionSubtitle}>Customize typography and text scaling for your ERP session.</Text>
          
          <CustomSelect
            label="Font Family"
            value={prefs.fontFamily}
            onValueChange={(val: string) => setPrefs(p => ({ ...p, fontFamily: val }))}
            options={[
              { label: 'Roboto (Salesforce Style)', value: 'roboto' },
              { label: 'Inter (Modern & Clean)', value: 'inter' },
              { label: 'Outfit (Geometric & Round)', value: 'outfit' },
              { label: 'System Default', value: 'system' }
            ]}
          />

          <CustomSelect
            label="Font Size"
            value={prefs.fontSize}
            onValueChange={(val: string) => setPrefs(p => ({ ...p, fontSize: val }))}
            options={[
              { label: 'Extra Small (12px)', value: 'xs' },
              { label: 'Small (14px)', value: 'small' },
              { label: 'Medium (16px)', value: 'medium' },
              { label: 'Large (18px)', value: 'large' },
              { label: 'Extra Large (20px)', value: 'xl' }
            ]}
          />
        </View>

        <View style={styles.divider} />

        {/* Table Display Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Table Display Preferences</Text>
          <Text style={styles.sectionSubtitle}>Configure global layout and padding for all data grids.</Text>
          
          <CustomSelect
            label="Default Table Density"
            value={prefs.tableDensity}
            onValueChange={(val: string) => setPrefs(p => ({ ...p, tableDensity: val }))}
            options={[
              { label: 'Compact (High Density)', value: 'compact' },
              { label: 'Comfortable (Standard)', value: 'comfortable' },
              { label: 'Spacious (Low Density)', value: 'spacious' }
            ]}
          />

          <CustomSelect
            label="Default Table Width"
            value={prefs.tableWidth}
            onValueChange={(val: string) => setPrefs(p => ({ ...p, tableWidth: val }))}
            options={[
              { label: 'Fill Screen (100% Width)', value: 'full' },
              { label: 'Fit Content (Tight Columns)', value: 'auto' }
            ]}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginBottom: 24,
  },
  selectContainer: {
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
  },
  selectButtonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
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
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalOptionSelected: {
    backgroundColor: '#0F172A',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#CBD5E1',
  },
  modalOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: 'bold',
  }
});
