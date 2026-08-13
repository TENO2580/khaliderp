'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Plus,
  Lock,
  Unlock,
  Settings,
  X,
  GripVertical,
  Pin,
  List,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ColumnPreference {
  header: string;
  visible: boolean;
  order: number;
  width?: number;
  pinned?: 'left' | 'right' | null;
}

export interface TablePreferences {
  columns: ColumnPreference[];
}

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  editableKey?: string;
  inlineEditable?: boolean;
  inputType?: 'text' | 'number';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  onAddClick?: () => void;
  addButtonLabel?: string;
  totalItems?: number;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onExportClick?: (mode: 'visible' | 'all', visibleHeaders: string[]) => void;
  isLoading?: boolean;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  startDate?: string;
  onStartDateChange?: (date: string) => void;
  endDate?: string;
  onEndDateChange?: (date: string) => void;
  statusFilter?: string;
  onStatusChange?: (status: string) => void;
  statusOptions?: { label: string; value: string }[];
  enableInlineEdit?: boolean;
  onBatchSave?: (edits: { rowId: string; key: string; value: string }[]) => void;
  hideToolbar?: boolean;
}

export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  onSearch,
  onAddClick,
  addButtonLabel = 'Add New',
  totalItems,
  page,
  totalPages,
  onPageChange,
  onExportClick,
  isLoading = false,
  limit,
  onLimitChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  statusFilter,
  onStatusChange,
  statusOptions,
  enableInlineEdit = false,
  onBatchSave,
  hideToolbar = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const pendingEditsRef = useRef<Record<string, Record<string, string>>>({});
  const [pendingCount, setPendingCount] = useState(0);

  // Column Management & Preferences
  const pathname = usePathname();
  const tablePrefKey = `tripidio_table_prefs_${pathname.replace(/\//g, '_')}`;

  const defaultPrefs: TablePreferences = useMemo(() => ({
    columns: columns.map((c, i) => ({
      header: c.header,
      visible: true,
      order: i,
      pinned: c.header.toUpperCase() === 'ACTIONS' ? 'left' : null
    }))
  }), [columns]);

  const [prefs, setPrefs] = useState<TablePreferences>(defaultPrefs);
  const [globalDensity, setGlobalDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');
  const [globalLayout, setGlobalLayout] = useState<'auto' | 'full'>('full');
  
  const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const loadGlobalPrefs = () => {
    try {
      if (typeof window !== 'undefined') {
        const density = localStorage.getItem('app-table-density');
        if (density) setGlobalDensity(density as any);
        const layout = localStorage.getItem('app-table-layout');
        if (layout) setGlobalLayout(layout as any);
      }
    } catch(e) {}
  };

  useEffect(() => {
    loadGlobalPrefs();
    const handleGlobalPrefChange = () => loadGlobalPrefs();
    window.addEventListener('app-table-prefs-changed', handleGlobalPrefChange);
    return () => window.removeEventListener('app-table-prefs-changed', handleGlobalPrefChange);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(tablePrefKey);
      if (saved) {
        const parsed = JSON.parse(saved) as TablePreferences;
        const mergedColumns = columns.map((c, i) => {
          const savedCol = parsed.columns.find(sc => sc.header === c.header);
          if (savedCol) return savedCol;
          return { header: c.header, visible: true, order: 999 + i, pinned: (c.header.toUpperCase() === 'ACTIONS' ? 'left' : null) as 'left' | null };
        });
        setPrefs({ columns: mergedColumns });
      } else {
        setPrefs(defaultPrefs);
      }
    } catch (e) {
      setPrefs(defaultPrefs);
    }
  }, [tablePrefKey, columns, defaultPrefs]);

  const savePrefs = (newPrefs: TablePreferences) => {
    setPrefs(newPrefs);
    localStorage.setItem(tablePrefKey, JSON.stringify(newPrefs));
  };

  const reorderedColumns = useMemo(() => {
    const colMap = new Map(columns.map(c => [c.header, c]));
    const sortedPrefs = [...prefs.columns].sort((a, b) => {
      if (a.pinned === 'left' && b.pinned !== 'left') return -1;
      if (b.pinned === 'left' && a.pinned !== 'left') return 1;
      return a.order - b.order;
    });
    
    return sortedPrefs
      .filter(p => p.visible)
      .map(p => {
         const col = colMap.get(p.header);
         return col ? { ...col, _pref: p } : null;
      })
      .filter(Boolean) as (Column<T> & { _pref: ColumnPreference })[];
  }, [columns, prefs]);

  // Client-side pagination state fallback
  const [internalPage, setInternalPage] = useState(1);
  const [internalLimit, setInternalLimit] = useState(10);

  const isServerPaginated = !!onPageChange;
  const actualLimit = limit ?? internalLimit;
  const actualPage = page ?? internalPage;

  const displayData = isServerPaginated ? data : data.slice((actualPage - 1) * actualLimit, actualPage * actualLimit);
  const displayTotal = isServerPaginated ? (totalItems ?? data.length) : data.length;
  const displayTotalPages = isServerPaginated ? (totalPages ?? 1) : Math.ceil(displayTotal / actualLimit) || 1;

  const handlePageChange = (p: number) => {
    if (onPageChange) onPageChange(p);
    else setInternalPage(p);
  };

  const handleLimitChange = (l: number) => {
    if (onLimitChange) onLimitChange(l);
    else {
      setInternalLimit(l);
      setInternalPage(1);
    }
  };

  // Click outside for export menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (onSearch) onSearch(val);
  };

  const trackEdit = (rowId: string, key: string, value: string) => {
    if (!pendingEditsRef.current[rowId]) {
      pendingEditsRef.current[rowId] = {};
    }
    pendingEditsRef.current[rowId][key] = value;
    let count = 0;
    for (const rid of Object.keys(pendingEditsRef.current)) {
      count += Object.keys(pendingEditsRef.current[rid]).length;
    }
    setPendingCount(count);
  };

  const handleLock = () => {
    if (isUnlocked && onBatchSave) {
      const edits: { rowId: string; key: string; value: string }[] = [];
      for (const [rowId, fields] of Object.entries(pendingEditsRef.current)) {
        for (const [key, value] of Object.entries(fields)) {
          edits.push({ rowId, key, value });
        }
      }
      if (edits.length > 0) {
        onBatchSave(edits);
      }
      pendingEditsRef.current = {};
      setPendingCount(0);
    }
    setIsUnlocked(!isUnlocked);
  };

  // DND Logic for Drawer
  const [draggedCol, setDraggedCol] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, header: string) => {
    setDraggedCol(header);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetHeader: string) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === targetHeader) return;

    const newCols = [...prefs.columns];
    const draggedIdx = newCols.findIndex(c => c.header === draggedCol);
    const targetIdx = newCols.findIndex(c => c.header === targetHeader);
    
    if (draggedIdx > -1 && targetIdx > -1) {
      const [removed] = newCols.splice(draggedIdx, 1);
      newCols.splice(targetIdx, 0, removed);
      newCols.forEach((c, idx) => { c.order = idx; });
      savePrefs({ ...prefs, columns: newCols });
    }
    setDraggedCol(null);
  };

  // Resizing logic
  const resizingCol = useRef<string | null>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onResizeStart = (e: React.MouseEvent, header: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizingCol.current = header;
    startX.current = e.pageX;
    startWidth.current = currentWidth;

    const onMouseMove = (moveEvt: MouseEvent) => {
      if (!resizingCol.current) return;
      const diff = moveEvt.pageX - startX.current;
      const newWidth = Math.max(80, startWidth.current + diff);
      
      setPrefs(prev => {
        const next = { ...prev, columns: [...prev.columns] };
        const col = next.columns.find(c => c.header === resizingCol.current);
        if (col) col.width = newWidth;
        return next;
      });
    };

    const onMouseUp = () => {
      if (resizingCol.current) {
        setPrefs(prev => {
          localStorage.setItem(tablePrefKey, JSON.stringify(prev));
          return prev;
        });
      }
      resizingCol.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onResizeDoubleClick = (header: string) => {
    setPrefs(prev => {
      const next = { ...prev, columns: [...prev.columns] };
      const col = next.columns.find(c => c.header === header);
      if (col) col.width = undefined; // Auto width
      localStorage.setItem(tablePrefKey, JSON.stringify(next));
      return next;
    });
  };

  const saveGlobalPrefs = (key: string, value: string) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event('app-table-prefs-changed'));
  };

  const getDensityPadding = () => {
    switch (globalDensity) {
      case 'compact': return 'px-2 py-2 text-xs';
      case 'spacious': return 'px-6 py-4 text-sm';
      default: return 'px-4 py-3 text-sm';
    }
  };

  const padClass = getDensityPadding();

  return (
    <div className="flex flex-col max-h-[calc(100vh-8rem)] rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden relative">
      {!hideToolbar && (
        <div className="flex-none flex flex-col gap-4 border-b border-gray-200/80 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onStartDateChange && (
            <input
              type={startDate ? 'date' : 'text'}
              placeholder="Start Date"
              onFocus={(e) => (e.target.type = 'date')}
              onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
              value={startDate || ''}
              max={endDate || undefined}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark] min-w-[130px] flex-1 sm:flex-none"
            />
          )}
          {onEndDateChange && (
            <input
              type={endDate ? 'date' : 'text'}
              placeholder="End Date"
              onFocus={(e) => (e.target.type = 'date')}
              onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
              value={endDate || ''}
              min={startDate || undefined}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark] min-w-[130px] flex-1 sm:flex-none"
            />
          )}
          {onStatusChange && statusOptions && (
            <select
              value={statusFilter || ''}
              onChange={(e) => onStatusChange(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsColumnManagerOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            <Settings className="h-4 w-4" />
            <span>Columns</span>
          </button>

          {onExportClick && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              {exportMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-800 dark:bg-gray-900 z-50">
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    onClick={() => {
                      onExportClick('visible', reorderedColumns.map(c => c.header));
                      setExportMenuOpen(false);
                    }}
                  >
                    Export Visible Columns
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                    onClick={() => {
                      onExportClick('all', columns.map(c => c.header));
                      setExportMenuOpen(false);
                    }}
                  >
                    Export All Columns
                  </button>
                </div>
              )}
            </div>
          )}

          {onAddClick && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{addButtonLabel}</span>
            </button>
          )}
          {enableInlineEdit && (
            <button
              onClick={handleLock}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-colors relative",
                isUnlocked
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {isUnlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              <span>{isUnlocked ? 'Save & Lock' : 'Unlock Edit'}</span>
              {isUnlocked && pendingCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      )}

      <div className="flex-1 overflow-x-auto w-full relative">
        <table className={cn("min-w-max text-left text-sm text-gray-600 dark:text-gray-400", globalLayout === 'auto' ? 'w-auto' : 'w-full')}>
          <thead className="sticky top-0 z-30 bg-gray-50 text-xs uppercase font-semibold tracking-wider text-gray-500 dark:bg-gray-950 dark:text-gray-400 shadow-sm border-b border-gray-200 dark:border-gray-800">
            <tr>
              {reorderedColumns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    width: col._pref.width ? `${col._pref.width}px` : 'auto',
                    minWidth: '80px'
                  }}
                  className={cn(
                    padClass,
                    "whitespace-nowrap bg-gray-50 dark:bg-gray-950 relative group",
                    col._pref.pinned === 'left' && "sticky left-0 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                    col._pref.pinned === 'right' && "sticky right-0 z-40 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                  )}
                >
                  {col.header}
                  <div
                    onMouseDown={(e) => onResizeStart(e, col.header, (e.target as HTMLElement).parentElement?.offsetWidth || 150)}
                    onDoubleClick={() => onResizeDoubleClick(col.header)}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400/50 z-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              Array.from({ length: Math.min(5, actualLimit) }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {reorderedColumns.map((col, cIdx) => (
                    <td key={cIdx} className={cn(padClass, col._pref.pinned === 'left' && "sticky left-0 z-10 bg-white dark:bg-gray-900")}>
                      <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayData.length === 0 ? (
              <tr>
                <td colSpan={reorderedColumns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              displayData.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="group transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
                >
                  {reorderedColumns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      style={{
                        width: col._pref.width ? `${col._pref.width}px` : 'auto',
                      }}
                      className={cn(
                        padClass,
                        "font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis border-r border-gray-100 dark:border-gray-800/50 last:border-r-0",
                        col._pref.pinned === 'left' && "sticky left-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]",
                        col._pref.pinned === 'right' && "sticky right-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                      )}
                    >
                      {isUnlocked && col.inlineEditable && col.editableKey ? (
                        <input
                          type="text"
                          defaultValue={
                            col.cell
                              ? (() => {
                                  const node = col.cell(row);
                                  if (typeof node === 'string') return node;
                                  if (React.isValidElement(node)) {
                                    const children = (node as any).props?.children;
                                    return typeof children === 'string' ? children : String(children ?? '');
                                  }
                                  return '';
                                })()
                              : col.accessorKey
                              ? String(row[col.accessorKey] ?? '')
                              : ''
                          }
                          onChange={(e) => {
                            let value = e.target.value;
                            if (col.inputType === 'number') {
                              const filtered = value.replace(/[^0-9.]/g, '');
                              if (value !== filtered) {
                                toast.error('Only numbers are allowed in this field');
                                value = filtered;
                                e.target.value = filtered;
                              }
                            }
                            const rowId = (row as any).id;
                            if (rowId && col.editableKey) {
                              trackEdit(rowId, col.editableKey, value);
                            }
                          }}
                          className="w-full min-w-[80px] rounded border border-amber-400/50 bg-amber-50/30 px-2 py-1 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-amber-900/20 dark:text-gray-100 dark:border-amber-600/50"
                        />
                      ) : (
                        col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? (row[col.accessorKey] as any)
                          : null
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200/80 px-6 py-4 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Rows per page:</span>
            <select
              value={actualLimit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Page <span className="font-semibold text-gray-900 dark:text-white">{actualPage}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{displayTotalPages}</span>
          </p>
          <div className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Total: {displayTotal}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={actualPage <= 1}
            onClick={() => handlePageChange(actualPage - 1)}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            disabled={actualPage >= displayTotalPages}
            onClick={() => handlePageChange(actualPage + 1)}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isColumnManagerOpen && (
        <div className="absolute inset-y-0 right-0 w-80 bg-white dark:bg-gray-950 shadow-2xl border-l border-gray-200 dark:border-gray-800 z-50 flex flex-col animate-in slide-in-from-right">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4" /> Customize Columns
            </h3>
            <button onClick={() => setIsColumnManagerOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Display Density</label>
              <div className="flex gap-2">
                {(['compact', 'comfortable', 'spacious'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => saveGlobalPrefs('app-table-density', d)}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border capitalize transition-colors",
                      globalDensity === d 
                        ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300" 
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Table Width</label>
              <div className="flex gap-2">
                <button
                  onClick={() => saveGlobalPrefs('app-table-layout', 'full')}
                  className={cn(
                    "flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors",
                    globalLayout !== 'auto'
                      ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300" 
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
                  )}
                >
                  Fill Screen
                </button>
                <button
                  onClick={() => saveGlobalPrefs('app-table-layout', 'auto')}
                  className={cn(
                    "flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors",
                    globalLayout === 'auto'
                      ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300" 
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
                  )}
                >
                  Fit Content
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {[...prefs.columns].sort((a,b) => a.order - b.order).map((c, idx) => (
              <div 
                key={c.header}
                draggable
                onDragStart={(e) => handleDragStart(e, c.header)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, c.header)}
                className={cn(
                  "flex items-center justify-between p-2 mb-1 rounded-lg border bg-white dark:bg-gray-900 transition-colors group",
                  draggedCol === c.header ? "opacity-50 border-blue-400 border-dashed" : "border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                )}
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                  <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <input
                    type="checkbox"
                    checked={c.visible}
                    onChange={(e) => {
                      const newCols = [...prefs.columns];
                      const col = newCols.find(x => x.header === c.header);
                      if (col) col.visible = e.target.checked;
                      savePrefs({...prefs, columns: newCols});
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{c.header}</span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    title="Pin Left"
                    onClick={() => {
                      const newCols = [...prefs.columns];
                      const col = newCols.find(x => x.header === c.header);
                      if (col) col.pinned = col.pinned === 'left' ? null : 'left';
                      savePrefs({...prefs, columns: newCols});
                    }}
                    className={cn("p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800", c.pinned === 'left' ? "text-blue-600 dark:text-blue-400" : "text-gray-400")}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => savePrefs(defaultPrefs)}
              className="w-full py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
