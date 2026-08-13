'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopExpenses from '@/components/desktop/DesktopExpenses';
import MobileExpenses from '@/components/mobile/MobileExpenses';

export default function ExpensesWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileExpenses /> : <DesktopExpenses />;
}
