'use client';

import React from 'react';
import { statusColors } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const formattedStatus = status.replace(/_/g, ' ');
  const badgeStyle = statusColors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
        badgeStyle,
        className
      )}
    >
      {formattedStatus}
    </span>
  );
}
