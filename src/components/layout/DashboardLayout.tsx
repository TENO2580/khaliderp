'use client';

import React, { useState, useEffect } from 'react';
import { useDeviceDetect } from '@/hooks/useDeviceDetect';
import DesktopLayout from './DesktopLayout';
import MobileLayout from './MobileLayout';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isMobile, isMounted } = useDeviceDetect();
  const shouldReduceMotion = useReducedMotion();

  // Initialize splash state only on the client, avoiding hydration mismatch because we wait for isMounted
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('tripidio_app_launched');
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && showSplash) {
      // Hide splash after 1.2s to allow animation and preloading
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('tripidio_app_launched', 'true');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // Prevent layout shift during initial hydration
  if (!isMounted) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#f4f7fb] dark:bg-[#050814]" />
    );
  }

  // Animation variants
  const splashVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }
  };

  const logoVariants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 16 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.7, 
        ease: [0.25, 1, 0.5, 1], // Custom spring-like ease out
        delay: 0.1
      }
    }
  };

  return (
    <>
      {/* Background Dashboard renders instantly for SWR preloading behind the splash screen */}
      {isMobile ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <DesktopLayout>{children}</DesktopLayout>
      )}

      {/* Foreground Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            variants={splashVariants}
            initial="visible"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-[9999] flex h-[100dvh] w-full flex-col items-center justify-center bg-[#050814]"
          >
            {/* Dark mode space glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white/60 rounded-full shadow-[0_0_5px_white]" />
               <div className="absolute top-[35%] right-[15%] w-0.5 h-0.5 bg-white/80 rounded-full shadow-[0_0_5px_white]" />
               <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[90%] max-w-lg aspect-square rounded-full bg-blue-600/15 blur-[100px]" />
            </div>

            <motion.div 
              variants={logoVariants}
              initial="hidden"
              animate="visible"
              className="relative z-10 flex flex-col items-center"
            >
              <div className="relative w-40 h-40 flex flex-col items-center justify-center mb-6">
                {/* The 3D Base Rings */}
                <div className="absolute bottom-2 w-32 h-6 rounded-[100%] border-[2px] border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.5)_inset]" />
                <div className="absolute bottom-3 w-40 h-8 rounded-[100%] border-[1px] border-blue-500/20" />
                <div className="absolute bottom-4 w-48 h-10 rounded-[100%] border-[1px] border-indigo-500/10" />
                
                {/* Beam of light */}
                <div className="absolute top-0 w-20 h-40 bg-gradient-to-b from-blue-400/30 via-blue-500/10 to-transparent blur-xl" />

                {/* The floating Hexagon logo */}
                <div className="relative z-10 w-[90px] h-[104px] bg-gradient-to-br from-cyan-300 via-blue-600 to-indigo-900 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.8)]" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                  <div className="w-[92%] h-[92%] bg-gradient-to-br from-[#1e40af] to-[#0f172a] flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                    <span className="text-[52px] font-black text-white italic drop-shadow-md tracking-tighter pr-2 font-sans leading-none">T</span>
                  </div>
                </div>
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2 font-sans">
                Tripidio <span className="text-blue-500">ERP</span>
              </h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
