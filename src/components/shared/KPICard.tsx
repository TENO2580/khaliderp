'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'rose' | 'emerald';
  subtitle?: string;
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]',
  amber: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  purple: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 dark:shadow-[0_0_15px_rgba(168,85,247,0.3)]',
  rose: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 dark:shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]',
};

export default function KPICard({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  color = 'blue',
  subtitle,
}: KPICardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-white bg-white/60 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:border-white/[0.05] dark:border-t-white/[0.15] dark:bg-[#12121a]/60 dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </span>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {value}
        </h3>
        {change && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
            )}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{change}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </motion.div>
  );
}
