import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { Palette } from '@/lib/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Palette.bg,
    card: Palette.surface,
    primary: Palette.primary500,
    text: Palette.text,
    border: 'transparent',
  },
};

export default function RootLayout() {
  const { session, loading } = useAuth();
  const { role, ready: roleReady } = useRole();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || !roleReady) return;

    const first = segments[0];
    const inAuthGroup = first === 'sign-in';
    const inCoach = first === '(coach)';
    const inKid = first === '(tabs)';

    if (!session && !inAuthGroup) {
      router.replace('/sign-in');
      return;
    }
    if (session && inAuthGroup) {
      router.replace(role === 'coach' ? '/(coach)' : '/(tabs)');
      return;
    }
    // udrž uživatele ve správné sekci podle role
    if (session && role === 'coach' && inKid) {
      router.replace('/(coach)');
    } else if (session && role === 'kid' && inCoach) {
      router.replace('/(tabs)');
    }
  }, [session, loading, roleReady, role, segments, router]);

  if (loading || !roleReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Palette.bg }}>
        <ActivityIndicator color={Palette.primary500} />
      </View>
    );
  }

  return (
    <ThemeProvider value={AppTheme}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: Palette.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(coach)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="krouzky" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
