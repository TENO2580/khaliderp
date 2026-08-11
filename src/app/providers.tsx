'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'sonner';

export function CustomizationLoader() {
  useEffect(() => {
    const font = localStorage.getItem('app-font');
    if (font) {
      document.documentElement.style.setProperty('--app-font-family', `var(--font-${font})`);
    }
    const size = localStorage.getItem('app-font-size');
    if (size) {
      const sizeMap: Record<string, string> = { xs: '12px', small: '14px', medium: '16px', large: '18px', xl: '20px' };
      document.documentElement.style.setProperty('--app-base-font-size', sizeMap[size] || '16px');
    }
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <CustomizationLoader />
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}
