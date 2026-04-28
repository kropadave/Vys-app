import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import {
  CartIcon,
  ChildIcon,
  CoinIcon,
  HomeTabIcon,
  ProfileTabIcon,
} from '@/components/icons/Icon3D';
import { Palette, Radius, Shadow } from '@/lib/theme';

export default function ParentTabLayout() {
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
          title: 'Rodič',
          tabBarIcon: ({ color }) => <HomeTabIcon size={26} tint={color} />,
        }}
      />
      <Tabs.Screen
        name="children"
        options={{
          title: 'Děti',
          tabBarIcon: () => <ChildIcon size={26} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Přihlášky',
          tabBarIcon: () => <CartIcon size={26} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Platby',
          tabBarIcon: () => <CoinIcon size={26} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <ProfileTabIcon size={26} tint={color} />,
        }}
      />
    </Tabs>
  );
}
