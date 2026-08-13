'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopReports from '@/components/desktop/DesktopReports';
import MobileReports from '@/components/mobile/MobileReports';

export default function ReportsWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileReports /> : <DesktopReports />;
}
