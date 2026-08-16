'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { AuthProvider, applyGlobalPreferences } from '@/lib/auth';
import { Toaster } from 'sonner';

export function CustomizationLoader() {
  useEffect(() => {
    const font = localStorage.getItem('app-font');
    const size = localStorage.getItem('app-font-size');
    const tableDensity = localStorage.getItem('app-table-density');
    const tableWidth = localStorage.getItem('app-table-layout');
    
    if (font || size || tableDensity || tableWidth) {
      applyGlobalPreferences({
        fontFamily: font,
        fontSize: size,
        tableDensity,
        tableWidth,
      });
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
