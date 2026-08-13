import { useState, useEffect } from 'react';

type ViewMode = 'card' | 'table';

export function useViewMode(defaultMode: ViewMode = 'card') {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('mobile_view_mode') as ViewMode;
      if (savedMode === 'card' || savedMode === 'table') {
        setViewMode(savedMode);
      }
    }
  }, []);

  const toggleViewMode = () => {
    setViewMode((prevMode) => {
      const newMode = prevMode === 'card' ? 'table' : 'card';
      if (typeof window !== 'undefined') {
        localStorage.setItem('mobile_view_mode', newMode);
      }
      return newMode;
    });
  };

  return { viewMode, toggleViewMode };
}
