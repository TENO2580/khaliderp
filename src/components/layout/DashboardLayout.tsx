'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isMobile, isMounted } = useDeviceDetect();

  // Prevent layout shift during initial hydration
  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f7fb] dark:bg-[#080810]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      </div>
    );
  }

  return isMobile ? (
    <MobileLayout>{children}</MobileLayout>
  ) : (
    <DesktopLayout>{children}</DesktopLayout>
  );
}
