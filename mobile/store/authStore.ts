import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isHydrated: false,

  login: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    
    set({ user, accessToken, refreshToken });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    
    set({ user: null, accessToken: null, refreshToken: null });
  },

  hydrate: async () => {
    try {
      const userStr = await SecureStore.getItemAsync('user');
      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (userStr && accessToken) {
        set({
          user: JSON.parse(userStr),
          accessToken,
          refreshToken,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch (e) {
      console.error('Failed to hydrate auth state', e);
      set({ isHydrated: true });
    }
  },
}));
