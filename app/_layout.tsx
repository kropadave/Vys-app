import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useAuth } from '@/hooks/use-auth';
import { useRole, type AppRole } from '@/hooks/use-role';
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

function routeForRole(role: AppRole) {
  if (role === 'coach') return '/(coach)';
  if (role === 'parent') return '/(parent)';
  return '/home';
}

export default function RootLayout() {
  const { session, loading } = useAuth();
  const { role, ready: roleReady } = useRole();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || !roleReady) return;

    const first = segments[0];
    const inPublic =
      first === undefined ||
      first === 'sign-in' ||
      first === 'krouzky' ||
      first === 'tabory' ||
      first === 'workshopy' ||
      first === 'kontakt';
    const inCoach = first === '(coach)';
    const inParent = first === '(parent)';
    const inParticipant = first === '(tabs)';

    if (!session && !inPublic) {
      router.replace('/sign-in');
      return;
    }

    if (!session || inPublic) return;

    const inCorrectArea =
      (role === 'coach' && inCoach) ||
      (role === 'parent' && inParent) ||
      (role === 'participant' && inParticipant);

    if (!inCorrectArea) {
      router.replace(routeForRole(role));
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
        <Stack.Screen name="(parent)" options={{ headerShown: false }} />
        <Stack.Screen name="(coach)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="krouzky" options={{ headerShown: false }} />
        <Stack.Screen name="tabory" options={{ headerShown: false }} />
        <Stack.Screen name="workshopy" options={{ headerShown: false }} />
        <Stack.Screen name="kontakt" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
