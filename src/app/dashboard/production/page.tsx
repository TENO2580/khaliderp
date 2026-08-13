'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopProduction from '@/components/desktop/DesktopProduction';
import MobileProduction from '@/components/mobile/MobileProduction';

export default function ProductionWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileProduction /> : <DesktopProduction />;
}
