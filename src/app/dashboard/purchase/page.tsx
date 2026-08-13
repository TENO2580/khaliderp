'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopPurchase from '@/components/desktop/DesktopPurchase';
import MobilePurchase from '@/components/mobile/MobilePurchase';

export default function PurchaseWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobilePurchase /> : <DesktopPurchase />;
}
