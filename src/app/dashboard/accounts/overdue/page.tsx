'use client';

import React from 'react';
import OverdueModule from '@/components/shared/modules/OverdueModule';

export default function OverduePage() {
  return (
    <div className="flex h-full w-full flex-col p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Overdue Accounts
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Track overdue invoices and outstanding customer balances.
        </p>
      </div>

      <div className="flex-1 rounded-xl border border-white bg-white/50 shadow-sm backdrop-blur-xl dark:border-white/[0.05] dark:bg-[#12121a]/50">
        <OverdueModule />
      </div>
    </div>
  );
}
