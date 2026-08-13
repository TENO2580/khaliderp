'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopRoutes from '@/components/desktop/DesktopRoutes';
import MobileRoutes from '@/components/mobile/MobileRoutes';

export default function RoutesWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileRoutes /> : <DesktopRoutes />;
}
