import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import {
  BoltIcon,
  ChildIcon,
  HomeTabIcon,
  ProfileTabIcon,
  TargetIcon,
} from '@/components/icons/Icon3D';
import { Palette, Radius, Shadow } from '@/lib/theme';

export default function CoachTabLayout() {
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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <HomeTabIcon size={26} tint={color} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Docházka',
          tabBarIcon: ({ color: _c }) => <TargetIcon size={26} />,
        }}
      />
      <Tabs.Screen
        name="unlock"
        options={{
          title: 'Odemknout',
          tabBarIcon: ({ color: _c }) => <BoltIcon size={26} />,
        }}
      />
      <Tabs.Screen
        name="wards"
        options={{
          title: 'Svěřenci',
          tabBarIcon: ({ color: _c }) => <ChildIcon size={26} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <ProfileTabIcon size={26} tint={color} />,
        }}
      />
      {/* skryté podstránky dostupné z Profilu */}
      <Tabs.Screen name="payouts" options={{ href: null }} />
      <Tabs.Screen name="gamification" options={{ href: null }} />
    </Tabs>
  );
}
