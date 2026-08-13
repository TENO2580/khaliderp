'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopDashboard from '@/components/desktop/DesktopDashboard';
import MobileDashboard from '@/components/mobile/MobileDashboard';

export default function DashboardPage() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileDashboard /> : <DesktopDashboard />;
}
