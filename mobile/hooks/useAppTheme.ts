import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';

type ThemeMode = 'light' | 'dark' | 'system';

export function useAppTheme() {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  useEffect(() => {
    // Load preference from AsyncStorage
    AsyncStorage.getItem('app-theme').then((storedTheme) => {
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setThemeMode(storedTheme as ThemeMode);
      }
    });

    // Listen for custom event from customization save (we'll implement this)
    // React Native doesn't have a built-in window.dispatchEvent like Web,
    // so we can use a polling approach or a simpler global store if needed.
    // For now, we will just export a function to manually update it if necessary.
  }, []);

  const effectiveTheme = themeMode === 'system' ? (systemColorScheme || 'dark') : themeMode;
  const colors = Colors[effectiveTheme];

  return { themeMode, effectiveTheme, colors, setThemeMode };
}
