'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopEmployees from '@/components/desktop/DesktopEmployees';
import MobileEmployees from '@/components/mobile/MobileEmployees';

export default function EmployeesWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileEmployees /> : <DesktopEmployees />;
}
