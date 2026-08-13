'use client';

import React from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopNotifications from '@/components/desktop/DesktopNotifications';
import MobileNotifications from '@/components/mobile/MobileNotifications';

export default function NotificationsWrapper() {
  const { isMobile, isMounted } = useDeviceDetect();

  if (!isMounted) return null;

  return isMobile ? <MobileNotifications /> : <DesktopNotifications />;
}
