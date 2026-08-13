'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import MobileMenu from '@/components/mobile/MobileMenu';

export default function MenuPageWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();
  const router = useRouter();

  useEffect(() => {
    // If a desktop user accesses this route, redirect to the main dashboard
    if (isMounted && !isMobile) {
      router.replace('/dashboard');
    }
  }, [isMobile, isMounted, router]);

  if (!isMounted) return null;

  // Only render on mobile
  return isMobile ? <MobileMenu /> : null;
}
