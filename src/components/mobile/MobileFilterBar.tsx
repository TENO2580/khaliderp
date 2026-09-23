import React from 'react';
import { Search, Filter, X, Plus, Lock, Unlock, Settings } from 'lucide-react';

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
  // Action buttons
  onAddClick?: () => void;
  addButtonLabel?: string;
  onUnlockToggle?: () => void;
  isUnlocked?: boolean;
  pendingEditCount?: number;
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
  statusOptions,
  onAddClick,
  addButtonLabel = 'Add New',
  onUnlockToggle,
  isUnlocked = false,
  pendingEditCount = 0,
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
                max={endDate || undefined}
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
                min={startDate || undefined}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:[color-scheme:dark]"
              />
            )}
          </div>

          {/* Action Buttons */}
          {(onAddClick || onUnlockToggle) && (
            <div className="flex gap-2 pt-1">
              {onUnlockToggle && (
                <button
                  onClick={onUnlockToggle}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors relative ${
                    isUnlocked
                      ? 'bg-amber-500 text-white active:bg-amber-600'
                      : 'bg-white border border-gray-200 text-gray-700 active:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                  }`}
                >
                  {isUnlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  <span>{isUnlocked ? 'Save & Lock' : 'Unlock Edit'}</span>
                  {isUnlocked && pendingEditCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {pendingEditCount}
                    </span>
                  )}
                </button>
              )}
              {onAddClick && (
                <button
                  onClick={onAddClick}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm active:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>{addButtonLabel}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
