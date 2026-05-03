import { Tabs } from 'expo-router';

import { Palette } from '@/lib/theme';

export default function CoachTabs() {
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
      <Tabs.Screen name="index" options={{ title: 'Dnes' }} />
      <Tabs.Screen name="attendance" options={{ title: 'Docházka' }} />
      <Tabs.Screen name="wards" options={{ title: 'Svěřenci' }} />
    </Tabs>
  );
}
