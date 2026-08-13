'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopSales from '@/components/desktop/DesktopSales';
import MobileSales from '@/components/mobile/MobileSales';

export default function SalesPageWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileSales /> : <DesktopSales />;
}
