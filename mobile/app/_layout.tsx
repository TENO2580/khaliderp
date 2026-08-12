import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '../store/authStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'login',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { isHydrated, hydrate } = useAuthStore();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    // Start hydrating auth state
    hydrate();
  }, []);

  useEffect(() => {
    if (loaded && isHydrated) {
      setAppIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [loaded, isHydrated]);

  if (!appIsReady) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      // Not logged in, redirect to login
      // Wrap in setTimeout to avoid routing during render cycles
      setTimeout(() => router.replace('/login'), 1);
    } else if (user && inAuthGroup) {
      // Logged in, redirect to dashboard
      setTimeout(() => router.replace('/(erp)/(tabs)'), 1);
    }
  }, [user, segments, isHydrated]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(erp)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
