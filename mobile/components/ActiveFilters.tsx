import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useFilterStore } from '../store/filterStore';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date-range' | 'text' | 'boolean' | 'number-range';
  options?: { label: string; value: string }[];
}

interface ActiveFiltersProps {
  module: string;
  config: FilterConfig[];
  onFiltersChanged?: () => void;
}

export default function ActiveFilters({ module, config, onFiltersChanged }: ActiveFiltersProps) {
  const colors = useThemeStore((state) => state.getColors());
  const { filters, setFilter, clearFilters } = useFilterStore();
  const activeFilters = filters[module] || {};

  const handleRemove = (key: string) => {
    setFilter(module, key, undefined);
    if (onFiltersChanged) onFiltersChanged();
  };

  const handleClearAll = () => {
    clearFilters(module);
    if (onFiltersChanged) onFiltersChanged();
  };

  const getFilterDisplayValue = (conf: FilterConfig, value: any) => {
    if (conf.type === 'select' && conf.options) {
      const option = conf.options.find(o => o.value === value);
      return option ? option.label : String(value);
    }
    if (conf.type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  const activeKeys = Object.keys(activeFilters).filter(k => 
    activeFilters[k] !== undefined && 
    activeFilters[k] !== '' &&
    activeFilters[k] !== null
  );

  // Combine startDate and endDate into a single "Date" chip if both exist, or handle them normally
  const hasStartDate = activeKeys.includes('startDate');
  const hasEndDate = activeKeys.includes('endDate');
  
  let renderKeys = [...activeKeys];
  if (hasStartDate || hasEndDate) {
    renderKeys = renderKeys.filter(k => k !== 'startDate' && k !== 'endDate');
    renderKeys.push('__dateRange');
  }

  if (activeKeys.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderKeys.map(key => {
          if (key === '__dateRange') {
            const start = activeFilters['startDate'];
            const end = activeFilters['endDate'];
            let display = '';
            if (start && end) display = `${start} to ${end}`;
            else if (start) display = `From ${start}`;
            else if (end) display = `Until ${end}`;

            return (
              <View key="dateRange" style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>Date: </Text>
                <Text style={[styles.chipValue, { color: colors.text }]}>{display}</Text>
                <TouchableOpacity onPress={() => {
                  setFilter(module, 'startDate', undefined);
                  setFilter(module, 'endDate', undefined);
                  if (onFiltersChanged) onFiltersChanged();
                }} style={styles.removeButton}>
                  <Feather name="x" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            );
          }

          const conf = config.find(c => c.key === key);
          if (!conf) return null;

          return (
            <View key={key} style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.chipLabel, { color: colors.textSecondary }]}>{conf.label}: </Text>
              <Text style={[styles.chipValue, { color: colors.text }]}>{getFilterDisplayValue(conf, activeFilters[key])}</Text>
              <TouchableOpacity onPress={() => handleRemove(key)} style={styles.removeButton}>
                <Feather name="x" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          );
        })}
        <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
          <Text style={[styles.clearAllText, { color: colors.danger }]}>Clear All</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 13,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  removeButton: {
    marginLeft: 6,
    padding: 2,
  },
  clearAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
