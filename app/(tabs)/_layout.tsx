import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import {
    BraceletTabIcon,
    HomeTabIcon,
    MedalTabIcon,
    ProfileTabIcon,
    TricksTabIcon,
} from '@/components/icons/Icon3D';
import { Palette, Radius, Shadow } from '@/lib/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Palette.primary500,
        tabBarInactiveTintColor: Palette.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 16,
          right: 16,
          height: 70,
          borderRadius: Radius.xl,
          backgroundColor: Palette.surface,
          borderTopWidth: 0,
          paddingTop: 10,
          ...Shadow.card,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Domů',
          tabBarIcon: ({ color }) => <HomeTabIcon size={26} tint={color} />,
        }}
      />
      <Tabs.Screen
        name="tricks"
        options={{
          title: 'Triky',
          tabBarIcon: ({ color }) => <TricksTabIcon size={26} tint={color} />,
        }}
      />
      <Tabs.Screen
        name="bracelet"
        options={{
          title: 'Náramek',
          tabBarIcon: ({ color }) => <BraceletTabIcon size={26} tint={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Odznaky',
          tabBarIcon: ({ color }) => <MedalTabIcon size={26} tint={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <ProfileTabIcon size={26} tint={color} />,
        }}
      />
      {/* Skrýt staré Explore – soubor zatím necháme, ať to nezlobí */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
