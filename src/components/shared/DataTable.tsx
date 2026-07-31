'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
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
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (onSearch) onSearch(val);
  };

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {/* Header controls */}
      <div className="flex flex-col gap-4 border-b border-gray-200/80 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
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

        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Table content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50/80 text-xs uppercase font-semibold tracking-wider text-gray-500 dark:bg-gray-950/50 dark:text-gray-400 border-b border-gray-200/80 dark:border-gray-800">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-3.5">
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
                  className="transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/50"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? (row[col.accessorKey] as any)
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200/80 px-6 py-4 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Page <span className="font-semibold text-gray-900 dark:text-white">{page}</span> of{' '}
            <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
            {totalItems !== undefined && ` (${totalItems} total items)`}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
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
