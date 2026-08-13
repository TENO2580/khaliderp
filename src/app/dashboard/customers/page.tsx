'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopCustomers from '@/components/desktop/DesktopCustomers';
import MobileCustomers from '@/components/mobile/MobileCustomers';

export default function CustomersWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileCustomers /> : <DesktopCustomers />;
}
