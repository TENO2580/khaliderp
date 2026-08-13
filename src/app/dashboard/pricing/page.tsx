'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopPricing from '@/components/desktop/DesktopPricing';
import MobilePricing from '@/components/mobile/MobilePricing';

export default function PricingEngineWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobilePricing /> : <DesktopPricing />;
}
