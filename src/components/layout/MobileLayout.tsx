'use client';

import React from 'react';
import MobileBottomNav from '../mobile/MobileBottomNav';
import MobileTopBar from '../mobile/MobileTopBar';
import GlobalSearch from '../shared/GlobalSearch';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-gray-950 overflow-hidden text-gray-900 dark:text-gray-100">
      <MobileTopBar onSearchOpen={() => setSearchOpen(true)} />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden w-full pb-[72px] pt-[60px] overscroll-none">
        <div className="p-4 w-full box-border">{children}</div>
      </main>

      <MobileBottomNav />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
