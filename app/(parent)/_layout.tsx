import { Tabs } from 'expo-router';

import { Palette } from '@/lib/theme';

export default function ParentTabs() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Palette.bg },
        headerTitleStyle: { color: Palette.text, fontWeight: '800' },
        headerTintColor: Palette.text,
        tabBarStyle: {
          backgroundColor: Palette.surface,
          borderTopColor: Palette.border,
        },
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: Palette.textMuted,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Přehled' }} />
      <Tabs.Screen name="children" options={{ title: 'Děti' }} />
      <Tabs.Screen name="payments" options={{ title: 'Platby' }} />
    </Tabs>
  );
}
