import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import Colors from '../constants/Colors';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  getEffectiveTheme: () => 'light' | 'dark';
  getColors: () => typeof Colors.light;
  hydrateTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'system',

  setThemeMode: async (mode: ThemeMode) => {
    await AsyncStorage.setItem('app-theme', mode);
    set({ themeMode: mode });
  },

  getEffectiveTheme: () => {
    const { themeMode } = get();
    if (themeMode === 'system') {
      return Appearance.getColorScheme() || 'dark';
    }
    return themeMode;
  },

  getColors: () => {
    const effective = get().getEffectiveTheme();
    return Colors[effective];
  },

  hydrateTheme: async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('app-theme');
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        set({ themeMode: storedTheme as ThemeMode });
      }
    } catch (e) {
      console.error(e);
    }
  },
}));
