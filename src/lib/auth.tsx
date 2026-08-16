'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  preferences?: any;
}

export const applyGlobalPreferences = (prefs: any) => {
  if (typeof window === 'undefined' || !prefs) return;
  
  if (prefs.fontFamily) {
    localStorage.setItem('app-font', prefs.fontFamily);
    document.documentElement.setAttribute('data-font', prefs.fontFamily);
    document.documentElement.style.setProperty('--app-font-family', `var(--font-${prefs.fontFamily})`);
  }
  if (prefs.fontSize) {
    localStorage.setItem('app-font-size', prefs.fontSize);
    document.documentElement.setAttribute('data-font-size', prefs.fontSize);
    const sizeMap: Record<string, string> = { xs: '12px', small: '14px', medium: '16px', large: '18px', xl: '20px' };
    document.documentElement.style.setProperty('--app-base-font-size', sizeMap[prefs.fontSize] || '16px');
  }
  if (prefs.tableDensity) {
    localStorage.setItem('app-table-density', prefs.tableDensity);
  }
  if (prefs.tableWidth) {
    localStorage.setItem('app-table-layout', prefs.tableWidth);
  }
  if (prefs.theme) {
    if (prefs.theme === 'dark') document.documentElement.classList.add('dark');
    else if (prefs.theme === 'light') document.documentElement.classList.remove('dark');
  }

  // Handle column visibility if present
  if (prefs.columnVisibility) {
    for (const [moduleName, config] of Object.entries(prefs.columnVisibility)) {
      localStorage.setItem(`table-cols-${moduleName}`, JSON.stringify(config));
    }
  }

  window.dispatchEvent(new Event('app-table-prefs-changed'));
  window.dispatchEvent(new Event('app-customization-changed'));
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize state synchronously from localStorage to prevent navigation lag
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('accessToken');
    }
    return false;
  });

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      const freshUser = response.data.data;
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
      applyGlobalPreferences(freshUser.preferences);
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    applyGlobalPreferences(userData.preferences);
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue logout even if API call fails
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedUser = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Instantly apply display preferences to the DOM when updated in settings
      if (updates.preferences) {
        applyGlobalPreferences(updatedUser.preferences);
      }
      
      return updatedUser;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
