import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useFilterStore } from '../store/filterStore';
import { FilterConfig } from './ActiveFilters';
import DatePicker from './DatePicker';

interface FilterPanelProps {
  visible: boolean;
  onClose: () => void;
  module: string;
  config: FilterConfig[];
  onApply: () => void;
}

export default function FilterPanel({ visible, onClose, module, config, onApply }: FilterPanelProps) {
  const colors = useThemeStore((state) => state.getColors());
  const { filters, setFilters, clearFilters } = useFilterStore();
  
  // Local state for the filter panel before applying
  const [localFilters, setLocalFilters] = useState<Record<string, any>>({});

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters[module] || {});
    }
  }, [visible, module, filters]);

  const updateLocalFilter = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyDatePreset = (preset: string) => {
    updateLocalFilter('__dateRangeMode', preset);
    if (preset === 'Custom Range') return;

    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'Today':
        break;
      case 'Yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'This Week': {
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(today.setDate(diff));
        end = new Date(today.setDate(start.getDate() + 6));
        break;
      }
      case 'Last Week': {
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7;
        start = new Date(today.setDate(diff));
        end = new Date(today.setDate(start.getDate() + 6));
        break;
      }
      case 'This Month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'Last Month':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'This Year':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
    }

    updateLocalFilter('startDate', start.toISOString().split('T')[0]);
    updateLocalFilter('endDate', end.toISOString().split('T')[0]);
  };

  const handleApply = () => {
    setFilters(module, localFilters);
    onApply();
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({});
    clearFilters(module);
    onApply();
    onClose();
  };

  const renderControl = (conf: FilterConfig) => {
    const val = localFilters[conf.key];

    switch (conf.type) {
      case 'text':
        return (
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            value={val || ''}
            onChangeText={(text) => updateLocalFilter(conf.key, text)}
            placeholder={`Enter ${conf.label}`}
            placeholderTextColor={colors.textSecondary}
          />
        );
      case 'select':
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {(conf.options || []).map(opt => {
              const isSelected = val === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => updateLocalFilter(conf.key, isSelected ? undefined : opt.value)}
                  style={[
                    styles.chip, 
                    { 
                      backgroundColor: isSelected ? colors.tint : colors.surface,
                      borderColor: isSelected ? colors.tint : colors.border
                    }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        );
      case 'date-range':
        const presets = ['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 'Last Month', 'This Year', 'Custom Range'];
        const activePreset = localFilters['__dateRangeMode'] || (localFilters['startDate'] ? 'Custom Range' : undefined);

        return (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
              {presets.map(preset => {
                const isSelected = activePreset === preset;
                return (
                  <TouchableOpacity
                    key={preset}
                    onPress={() => applyDatePreset(preset)}
                    style={[
                      styles.chip, 
                      { 
                        backgroundColor: isSelected ? colors.tint : colors.surface,
                        borderColor: isSelected ? colors.tint : colors.border
                      }
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                      {preset}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {activePreset === 'Custom Range' && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <DatePicker 
                    label="From" 
                    placeholder="Select start date"
                    value={localFilters['startDate'] || ''}
                    onChange={(date) => updateLocalFilter('startDate', date)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DatePicker 
                    label="To" 
                    placeholder="Select end date"
                    value={localFilters['endDate'] || ''}
                    onChange={(date) => updateLocalFilter('endDate', date)}
                  />
                </View>
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <View style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
            {config.map(conf => (
              <View key={conf.key} style={styles.filterSection}>
                <Text style={[styles.label, { color: colors.text }]}>{conf.label}</Text>
                {renderControl(conf)}
              </View>
            ))}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.btn, styles.btnReset, { borderColor: colors.border }]} onPress={handleReset}>
              <Text style={[styles.btnText, { color: colors.text }]}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnApply, { backgroundColor: colors.tint }]} onPress={handleApply}>
              <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnReset: {
    borderWidth: 1,
  },
  btnApply: {
    
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
