'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopSettings from '@/components/desktop/DesktopSettings';
import MobileSettings from '@/components/mobile/MobileSettings';

export default function SettingsWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileSettings /> : <DesktopSettings />;
}
