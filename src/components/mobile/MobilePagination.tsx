import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobilePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}

export default function MobilePagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
}: MobilePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-gray-200 dark:border-gray-800 dark:bg-gray-900 mb-20 mt-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Total: <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
