'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopIntelligence from '@/components/desktop/DesktopIntelligence';
import MobileIntelligence from '@/components/mobile/MobileIntelligence';

export default function IntelligenceWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileIntelligence /> : <DesktopIntelligence />;
}
