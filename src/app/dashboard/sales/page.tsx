'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import SalesModule from '@/components/shared/modules/SalesModule';

export default function SalesPageWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return <SalesModule isMobile={isMobile} />;
}
