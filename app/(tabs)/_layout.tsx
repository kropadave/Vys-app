import { Tabs } from 'expo-router';

import { Palette } from '@/lib/theme';

export default function ParticipantTabs() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Palette.bg },
        headerTitleStyle: { color: Palette.text, fontWeight: '900' },
        headerTintColor: Palette.text,
        tabBarStyle: {
          backgroundColor: Palette.surface,
          borderTopColor: Palette.border,
        },
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.textMuted,
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
      }}>
      <Tabs.Screen name="home" options={{ title: 'Přehled' }} />
      <Tabs.Screen name="tricks" options={{ title: 'Skill tree' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Cesta' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Žebříček' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
