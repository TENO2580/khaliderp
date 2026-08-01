'use client';

import React, { useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  Plus,
  Lock,
  Unlock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  editableKey?: string;
  inlineEditable?: boolean;
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
  onExportClick?: () => void;
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
}

export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  searchPlaceholder = 'Search...',
  onSearch,
  onAddClick,
  addButtonLabel = 'Add New',
  totalItems,
  page = 1,
  totalPages = 1,
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
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const pendingEditsRef = useRef<Record<string, Record<string, string>>>({});
  const [pendingCount, setPendingCount] = useState(0);

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
    // Count total unique edits
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

  return (
    <div className="flex flex-col max-h-[calc(100vh-8rem)] rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* Header controls */}
      <div className="flex-none flex flex-col gap-4 border-b border-gray-200/80 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 focus:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onStartDateChange && (
            <input
              type={startDate ? 'date' : 'text'}
              placeholder="Start Date"
              onFocus={(e) => (e.target.type = 'date')}
              onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
              value={startDate || ''}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark] min-w-[130px] flex-1 sm:flex-none"
              title="Start Date"
            />
          )}
          {onEndDateChange && (
            <input
              type={endDate ? 'date' : 'text'}
              placeholder="End Date"
              onFocus={(e) => (e.target.type = 'date')}
              onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
              value={endDate || ''}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark] min-w-[130px] flex-1 sm:flex-none"
              title="End Date"
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
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {onExportClick && (
            <button
              onClick={onExportClick}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
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

      {/* Table content */}
      <div className="flex-1 overflow-auto w-full">
        <table className="w-full min-w-max text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="sticky top-0 z-30 bg-gray-50 text-xs uppercase font-semibold tracking-wider text-gray-500 dark:bg-gray-950 dark:text-gray-400 outline outline-1 outline-gray-200 dark:outline-gray-800 shadow-sm">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "px-6 py-3.5 whitespace-nowrap bg-gray-50 dark:bg-gray-950",
                    idx === 0 && "sticky left-0 z-40"
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-6 py-4">
                      <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row.id || rIdx}
                  className="group transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={cIdx}
                      className={cn(
                        "px-6 py-4 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap border border-gray-200 dark:border-gray-800",
                        cIdx === 0 && "sticky left-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-gray-50 dark:group-hover:bg-gray-800"
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
                            const rowId = (row as any).id;
                            if (rowId && col.editableKey) {
                              trackEdit(rowId, col.editableKey, e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
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

      {/* Pagination Footer */}
      {((onPageChange && totalPages > 1) || (limit && onLimitChange)) && (
        <div className="flex items-center justify-between border-t border-gray-200/80 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-4">
            {limit && onLimitChange && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => onLimitChange(Number(e.target.value))}
                  className="rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  <option value={10}>10</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Page <span className="font-semibold text-gray-900 dark:text-white">{page}</span> of{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
            </p>
            <div className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              Total: {totalItems ?? data.length}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={!onPageChange || page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={!onPageChange || page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
