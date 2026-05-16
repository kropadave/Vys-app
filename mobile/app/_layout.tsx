import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import 'react-native-reanimated';

import { useAuth } from '@/hooks/use-auth';
import { useRole, type AppRole } from '@/hooks/use-role';
import { DEV_BYPASS_ROLE_GUARD } from '@/lib/dev-config';
import { supabase } from '@/lib/supabase';
import { Palette } from '@/lib/theme';

export const unstable_settings = {
  anchor: 'sign-in',
};

const AppTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: Palette.bg,
    card: Palette.surface,
    primary: Palette.primary,
    text: Palette.text,
    border: Palette.border,
    notification: Palette.accent,
  },
};

function routeForRole(role: AppRole) {
  if (role === 'coach') return '/coach';
  return '/tricks';
}

export default function RootLayout() {
  const { session, loading } = useAuth();
  const { role, ready: roleReady, setRole } = useRole();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register('/sw.js?v=3-zero-progress', { updateViaCache: 'none' })
      .then((registration) => {
        if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              worker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
        return registration.update();
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (DEV_BYPASS_ROLE_GUARD) return;
    if (loading || !roleReady) return;

    const first = segments[0] as string | undefined;
    const inPublic = first === undefined || first === 'sign-in' || first === 'qr-claim';
    const inCoach = first === '(coach)';
    const inParticipant = first === '(tabs)';
    const inShared = first === 'spots';

    if (inPublic) {
      if (first === undefined && session && role) router.replace(routeForRole(role));
      return;
    }

    if (!session) {
      router.replace('/sign-in');
      return;
    }

    if (!role) {
      router.replace('/sign-in');
      return;
    }

    const inCorrectArea =
      (role === 'coach' && inCoach) ||
      (role === 'participant' && inParticipant) ||
      inShared;

    if (!inCorrectArea) {
      router.replace(routeForRole(role));
    }
  }, [session, loading, roleReady, role, segments, router]);

  useEffect(() => {
    const supabaseClient = supabase;
    if (DEV_BYPASS_ROLE_GUARD) return;
    if (loading || !roleReady || role !== 'coach' || !session || !supabaseClient) return;

    let cancelled = false;
    supabaseClient
      .from('coach_profiles')
      .select('approval_status')
      .eq('id', session.userId)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (cancelled || error || data?.approval_status === 'approved') return;
        await supabaseClient.auth.signOut();
        await setRole(null);
        router.replace('/sign-in');
      });

    return () => {
      cancelled = true;
    };
  }, [loading, roleReady, role, session, router, setRole]);

  if (loading || !roleReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Palette.bg,
        }}>
        <ActivityIndicator color={Palette.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={AppTheme}>
      <Head>
        <title>TeamVYS aplikace</title>
        <meta name="description" content="Aplikace TeamVYS pro účastníky a trenéry." />
        <meta name="application-name" content="TeamVYS" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="TeamVYS" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0B0612" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/pwa/icon-192.png" />
      </Head>
      <Stack screenOptions={{ contentStyle: { backgroundColor: Palette.bg } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="qr-claim" options={{ headerShown: false }} />
        <Stack.Screen name="spots" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(coach)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
