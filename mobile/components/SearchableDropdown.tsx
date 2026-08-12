import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

export interface SearchableDropdownProps<T> {
  data: T[];
  value: string;
  onSelect: (value: string) => void;
  keyExtractor?: (item: T) => string;
  labelExtractor?: (item: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export default function SearchableDropdown<T>({
  data,
  value,
  onSelect,
  keyExtractor = (item: any) => item.id,
  labelExtractor = (item: any) => item.name || item.title || item.label || 'Unknown',
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  disabled = false,
}: SearchableDropdownProps<T>) {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedItem = useMemo(() => {
    return data.find(item => keyExtractor(item) === value);
  }, [data, value, keyExtractor]);

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(item => {
      const label = labelExtractor(item).toLowerCase();
      return label.includes(lowerQuery);
    });
  }, [data, searchQuery, labelExtractor]);

  const handleSelect = (itemValue: string) => {
    onSelect(itemValue);
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      <TouchableOpacity 
        style={[styles.trigger, disabled && styles.triggerDisabled]} 
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !selectedItem && styles.placeholderText]} numberOfLines={1}>
          {selectedItem ? labelExtractor(selectedItem) : placeholder}
        </Text>
        <Feather name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Feather name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={(item, index) => keyExtractor(item) + '-' + index}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContainer}
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={11}
              renderItem={({ item }) => {
                const itemKey = keyExtractor(item);
                const isSelected = itemKey === value;
                return (
                  <TouchableOpacity
                    style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                    onPress={() => handleSelect(itemKey)}
                  >
                    <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                      {labelExtractor(item)}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={20} color={colors.tint} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No results found</Text>
                </View>
              }
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  triggerDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.7,
  },
  triggerText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  itemRowSelected: {
    backgroundColor: colors.tint + '15',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
    marginRight: 16,
  },
  itemTextSelected: {
    color: colors.tint,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
  },
});
