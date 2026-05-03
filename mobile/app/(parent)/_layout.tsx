import { Tabs } from 'expo-router';

import { Palette } from '@/lib/theme';

export default function ParentTabs() {
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
      <Tabs.Screen name="parent" options={{ title: 'Přehled' }} />
      <Tabs.Screen name="parent-children" options={{ title: 'Účastníci' }} />
      <Tabs.Screen name="parent-payments" options={{ title: 'Platby' }} />
      <Tabs.Screen name="parent-profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
