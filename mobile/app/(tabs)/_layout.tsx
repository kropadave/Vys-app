import { Tabs } from 'expo-router';

import { GlassTabBarBackground } from '@/components/glass-tab-bar-background';
import { NavigationHeaderBackground } from '@/components/navigation-header-background';
import { TabBarIcon, type TabIconName } from '@/components/tab-bar-icon';
import { Brand } from '@/lib/brand';
import { Palette } from '@/lib/theme';
import { useBreakpoint } from '@/lib/use-breakpoint';

const tabIcons: Record<string, TabIconName> = {
  home: 'overview',
  tricks: 'skill-tree',
  rewards: 'rewards',
  dochazka: 'attendance',
  leaderboard: 'leaderboard',
};

export default function ParticipantTabs() {
  const { width, isMobile } = useBreakpoint();
  const tabBarGap = isMobile ? 14 : 20;
  const tabBarWidth = Math.min(Math.max(width - tabBarGap * 2, 280), 430);
  const tabBarLeft = Math.max(tabBarGap, (width - tabBarWidth) / 2);

  return (
    <Tabs
      initialRouteName="tricks"
      screenOptions={({ route }) => ({
        headerShown: route.name !== 'tricks',
        headerBackground: () => <NavigationHeaderBackground />,
        headerStyle: {
          backgroundColor: Palette.bg,
        },
        headerTitleAlign: 'left',
        headerTitleStyle: {
          color: Palette.text,
          fontWeight: '900',
          fontSize: isMobile ? 26 : 30,
          letterSpacing: 0,
        },
        headerTintColor: Palette.text,
        headerShadowVisible: false,
        animation: 'shift',
        tabBarStyle: {
          position: 'absolute',
          bottom: isMobile ? 14 : 20,
          left: tabBarLeft,
          width: tabBarWidth,
          backgroundColor: 'rgba(255,255,255,0.60)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.82)',
          borderTopColor: 'rgba(255,255,255,0.92)',
          borderTopWidth: 1,
          borderRadius: 30,
          minHeight: isMobile ? 60 : 62,
          height: isMobile ? 60 : 62,
          paddingTop: 6,
          paddingBottom: 6,
          paddingHorizontal: isMobile ? 6 : 10,
          overflow: 'hidden',
          shadowColor: Brand.purpleDeep,
          shadowOpacity: 0.13,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        },
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarItemStyle: { alignItems: 'center', justifyContent: 'center', height: 48, paddingVertical: 0, borderRadius: 22 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: Brand.purpleDeep,
        tabBarInactiveTintColor: 'rgba(26,19,38,0.50)',
        tabBarIcon: ({ focused, color }) => (
          <TabBarIcon name={tabIcons[route.name] ?? 'overview'} focused={focused} color={color} />
        ),
        tabBarIconStyle: { height: 49, marginTop: 0, marginBottom: 0 },
      })}>
      <Tabs.Screen name="home" options={{ title: 'Přehled', tabBarAccessibilityLabel: 'Přehled' }} />
      <Tabs.Screen name="rewards" options={{ title: 'Cesta', tabBarAccessibilityLabel: 'Cesta' }} />
      <Tabs.Screen name="tricks" options={{ title: 'Skill tree', tabBarAccessibilityLabel: 'Triky' }} />
      <Tabs.Screen name="dochazka" options={{ title: 'Docházka', tabBarAccessibilityLabel: 'Docházka' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Žebříček', tabBarAccessibilityLabel: 'Žebříček' }} />
      <Tabs.Screen name="tutorials" options={{ href: null, title: 'Tutoriály', headerShown: false }} />
    </Tabs>
  );
}
