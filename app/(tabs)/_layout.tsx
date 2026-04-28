import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Domů',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tricks"
        options={{
          title: 'Triky',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="figure.run" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bracelet"
        options={{
          title: 'Náramek',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="circle.hexagongrid.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Odznaky',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="rosette" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
        }}
      />
      {/* Skrýt staré Explore – soubor zatím necháme, ať to nezlobí */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
