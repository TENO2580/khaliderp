'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import GlobalSearch from '../shared/GlobalSearch';

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show loading skeleton while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading Khalid ERP...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#f4f7fb] dark:bg-[#080810] relative overflow-hidden">
      {/* Ambient Backgrounds for Light & Dark Mode Glass Effect */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-purple-400/20 blur-[120px] dark:bg-purple-900/20" />
      <div className="pointer-events-none absolute top-20 right-0 h-[500px] w-[500px] rounded-full bg-blue-400/20 blur-[100px] dark:bg-blue-900/20" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-orange-400/10 blur-[120px] dark:bg-emerald-900/10" />

      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <TopNav 
        sidebarCollapsed={sidebarCollapsed} 
        onSearchOpen={() => setSearchOpen(true)} 
        onMobileMenuClick={() => setMobileSidebarOpen(true)}
      />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          'ml-0', // Default (Mobile)
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]' // Desktop
        )}
      >
        <div className="p-4 md:p-6">{children}</div>
      </main>

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
