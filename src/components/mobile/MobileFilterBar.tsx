import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface MobileFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  startDate?: string;
  onStartDateChange?: (val: string) => void;
  endDate?: string;
  onEndDateChange?: (val: string) => void;
  statusFilter?: string;
  onStatusChange?: (val: string) => void;
  statusOptions?: { label: string; value: string }[];
}

export default function MobileFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  statusFilter,
  onStatusChange,
  statusOptions
}: MobileFilterBarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const hasActiveFilters = Boolean(
    (startDate && onStartDateChange) || 
    (endDate && onEndDateChange) || 
    (statusFilter && onStatusChange)
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-3 mb-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors dark:text-white placeholder-gray-400"
          />
        </div>
        {(onStartDateChange || onEndDateChange || onStatusChange) && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-2 rounded-xl border transition-colors ${
              hasActiveFilters || isOpen
                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                : 'bg-white border-gray-200 text-gray-600 active:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 dark:active:bg-gray-800'
            }`}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Filter className="h-5 w-5" />}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="flex flex-col gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2">
          {onStatusChange && statusOptions && (
            <select
              value={statusFilter || ''}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          
          <div className="flex gap-2">
            {onStartDateChange && (
              <input
                type={startDate ? 'date' : 'text'}
                placeholder="Start Date"
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                value={startDate || ''}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark]"
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
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark]"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
