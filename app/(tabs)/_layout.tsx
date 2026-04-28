import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
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
        name="index"
        options={{
          title: 'Domů',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tricks"
        options={{
          title: 'Triky',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="figure.run" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bracelet"
        options={{
          title: 'Náramek',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="circle.hexagongrid.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Odznaky',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="rosette" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="person.crop.circle.fill" color={color} />,
        }}
      />
      {/* Skrýt staré Explore – soubor zatím necháme, ať to nezlobí */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
