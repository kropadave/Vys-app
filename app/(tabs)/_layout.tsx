import { Tabs } from 'expo-router';

import { Palette } from '@/lib/theme';

export default function ParticipantTabs() {
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
      <Tabs.Screen name="index" options={{ title: 'Domů' }} />
      <Tabs.Screen name="tricks" options={{ title: 'Triky' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
