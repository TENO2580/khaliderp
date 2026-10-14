'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopActivities from '@/components/desktop/DesktopActivities';
import MobileActivities from '@/components/mobile/MobileActivities';

export default function ActivitiesPage() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileActivities /> : <DesktopActivities />;
}
