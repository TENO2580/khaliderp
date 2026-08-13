import { useState, useEffect } from 'react';

export function useDeviceDetect() {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if the screen is mobile-sized (< 1024px)
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    // Check if running in standalone mode (PWA)
    const checkIsStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
             (window.navigator as any).standalone === true;
    };

    // Initial check
    checkIsMobile();

    // If installed as PWA, always use mobile view regardless of window resize
    if (checkIsStandalone()) {
      setIsMobile(true);
      return;
    }

    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return { isMobile, isMounted };
}
