'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopBatches from '@/components/desktop/DesktopBatches';
import MobileBatches from '@/components/mobile/MobileBatches';

export default function BatchesWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileBatches /> : <DesktopBatches />;
}
