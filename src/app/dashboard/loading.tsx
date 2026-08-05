import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
        Loading data...
      </p>
    </div>
  );
}
