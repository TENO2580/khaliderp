import React, { useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import SkeletonList from './SkeletonList';

export interface Column {
  key: string;
  title: string;
  width?: number;
  render?: (item: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowPress?: (item: any) => void;
  keyExtractor?: (item: any) => string;
  showActions?: boolean;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  isLoading?: boolean;
  serverPagination?: boolean;
  serverPage?: number;
  serverTotalPages?: number;
  onPageChange?: (page: number) => void;
}

const DataTableRow = memo(({ item, index, columns, showActions, defaultWidth, onRowPress, onEdit, onDelete, styles, colors }: any) => {
  return (
    <TouchableOpacity 
      style={[styles.row, index % 2 === 1 && styles.rowAlternate]} 
      onPress={() => onRowPress && onRowPress(item)}
      disabled={!onRowPress}
    >
      {showActions && (
        <View style={[styles.cell, { width: 50, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
          <TouchableOpacity onPress={() => onEdit && onEdit(item)}>
            <Feather name="edit-2" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete && onDelete(item)}>
            <Feather name="trash-2" size={14} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )}
      {columns.map((col: any) => (
        <View key={col.key} style={[styles.cell, { width: col.width || defaultWidth }]}>
          {col.render ? col.render(item) : (
            <Text 
              style={styles.cellText} 
              numberOfLines={1}
              onLongPress={() => {
                const val = item[col.key];
                if (val) Alert.alert(col.title, String(val));
              }}
            >
              {item[col.key] || '-'}
            </Text>
          )}
        </View>
      ))}
    </TouchableOpacity>
  );
});

export function DataTable({ columns, data, onRowPress, keyExtractor, showActions, onEdit, onDelete, isLoading, serverPagination, serverPage, serverTotalPages, onPageChange }: DataTableProps) {
  const colors = useThemeStore((state) => state.getColors());
  const styles = getStyles(colors);
  
  const [localPage, setLocalPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showPicker, setShowPicker] = useState(false);

  const defaultWidth = 120;
  
  const totalWidth = columns.reduce((sum, col) => sum + (col.width || defaultWidth), showActions ? 50 : 0);

  const page = serverPagination ? (serverPage || 1) : localPage;
  const totalPages = serverPagination ? (serverTotalPages || 1) : (Math.ceil(data.length / limit) || 1);
  const paginatedData = serverPagination ? data : data.slice((page - 1) * limit, page * limit);

  const handlePageChange = (newPage: number) => {
    if (serverPagination && onPageChange) {
      onPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      {showActions && (
        <View style={[styles.headerCell, { width: 50 }]} />
      )}
      {columns.map((col, index) => (
        <View key={col.key} style={[styles.headerCell, { width: col.width || defaultWidth }]}>
          <Text style={styles.headerText}>{col.title}</Text>
        </View>
      ))}
    </View>
  );

  const renderItem = useCallback(({ item, index }: { item: any, index: number }) => (
    <DataTableRow 
      item={item} 
      index={index} 
      columns={columns} 
      showActions={showActions} 
      defaultWidth={defaultWidth} 
      onRowPress={onRowPress} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      styles={styles}
      colors={colors}
    />
  ), [columns, showActions, defaultWidth, onRowPress, onEdit, onDelete, styles, colors]);

  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <View style={styles.paginationLeft}>
        <Text style={styles.paginationText}>Rows:</Text>
        <TouchableOpacity style={styles.limitBtn} onPress={() => setShowPicker(true)}>
          <Text style={styles.limitBtnText}>{limit}</Text>
          <Feather name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.paginationText}>
          Pg <Text style={styles.paginationTextBold}>{page}</Text> of <Text style={styles.paginationTextBold}>{totalPages}</Text>
        </Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>Tot: {data.length}</Text>
        </View>
      </View>
      
      <View style={styles.paginationRight}>
        <TouchableOpacity 
          style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
          disabled={page <= 1}
          onPress={() => handlePageChange(Math.max(1, page - 1))}
        >
          <Feather name="chevron-left" size={18} color={page <= 1 ? colors.border : colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
          disabled={page >= totalPages}
          onPress={() => handlePageChange(Math.min(totalPages, page + 1))}
        >
          <Feather name="chevron-right" size={18} color={page >= totalPages ? colors.border : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal visible={showPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={styles.pickerContainer}>
            {[10, 30, 50, 100, 200].map(val => (
              <TouchableOpacity 
                key={val}
                style={[styles.pickerItem, limit === val && styles.pickerItemActive]}
                onPress={() => {
                  setLimit(val);
                  handlePageChange(1);
                  setShowPicker(false);
                }}
              >
                <Text style={[styles.pickerItemText, limit === val && styles.pickerItemTextActive]}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={{ width: totalWidth, flex: 1 }}>
          {renderHeader()}
          <SkeletonList rows={5} />
        </View>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.emptyStateText}>No data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={{ width: totalWidth, flex: 1 }}>
          {renderHeader()}
          <FlatList
            data={paginatedData}
            renderItem={renderItem}
            keyExtractor={keyExtractor || ((item, index) => item.id || index.toString())}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </View>
      </ScrollView>
      {renderPagination()}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  headerCell: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  headerText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    paddingVertical: 10,
  },
  rowAlternate: {
    backgroundColor: colors.surface,
  },
  cell: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cellText: {
    color: colors.text,
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyStateText: {
    color: colors.textSecondary,
    marginTop: 16,
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  paginationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  paginationTextBold: {
    color: colors.text,
    fontWeight: 'bold',
  },
  limitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 2,
  },
  limitBtnText: {
    color: colors.text,
    fontSize: 11,
  },
  totalBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  totalBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  paginationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: 200,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  pickerItemActive: {
    backgroundColor: colors.tint + '20',
  },
  pickerItemText: {
    color: colors.text,
    fontSize: 16,
  },
  pickerItemTextActive: {
    color: colors.tint,
    fontWeight: 'bold',
  }
});
