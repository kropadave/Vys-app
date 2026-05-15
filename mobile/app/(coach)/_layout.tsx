import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { CoachColors } from '@/lib/coach-theme';
import { useBreakpoint } from '@/lib/use-breakpoint';

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const tabIcons: Record<string, MaterialIconName> = {
  coach: 'view-dashboard-outline',
  attendance: 'calendar-check-outline',
  qr: 'qrcode-scan',
  wards: 'account-group-outline',
  'ward-detail': 'account-group-outline',
  'participant-search': 'account-search-outline',
  'coach-leaderboard': 'podium-gold',
  'coach-profile': 'account-circle-outline',
  'coach-inspiration': 'book-open-page-variant-outline',
};

export default function CoachTabs() {
  const { width, isMobile } = useBreakpoint();
  const tabBarGap = isMobile ? 12 : 20;
  const tabBarWidth = Math.min(Math.max(width - tabBarGap * 2, 320), 620);
  const tabBarLeft = Math.max(tabBarGap, (width - tabBarWidth) / 2);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerBackground: () => <CoachHeaderBackground />,
        headerStyle: {
          backgroundColor: CoachColors.bg,
        },
        headerTitleAlign: 'left',
        headerTitleStyle: {
          color: CoachColors.slate,
          fontWeight: '900',
          fontSize: isMobile ? 26 : 30,
          letterSpacing: 0,
        },
        headerTintColor: CoachColors.slate,
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
          shadowColor: CoachColors.slate,
          shadowOpacity: 0.10,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        },
        tabBarBackground: () => <CoachTabBarBackground />,
        tabBarItemStyle: { alignItems: 'center', justifyContent: 'center', height: 48, paddingVertical: 0, borderRadius: 22 },
        tabBarActiveBackgroundColor: 'transparent',
        tabBarShowLabel: false,
        tabBarActiveTintColor: CoachColors.blue,
        tabBarInactiveTintColor: CoachColors.slateMuted,
        tabBarIcon: ({ focused, color }) => (
          <CoachTabIcon name={tabIcons[route.name] ?? 'view-dashboard-outline'} focused={focused} color={color} />
        ),
        tabBarIconStyle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
      })}>
      <Tabs.Screen name="coach" options={{ title: 'Přehled', tabBarAccessibilityLabel: 'Přehled' }} />
      <Tabs.Screen name="attendance" options={{ title: 'Docházka', tabBarAccessibilityLabel: 'Docházka' }} />
      <Tabs.Screen name="qr" options={{ title: 'QR kódy', tabBarAccessibilityLabel: 'QR kódy' }} />
      <Tabs.Screen name="wards" options={{ title: 'Svěřenci', tabBarAccessibilityLabel: 'Svěřenci' }} />
      <Tabs.Screen name="ward-detail" options={{ href: null, title: 'Detail dítěte' }} />
      <Tabs.Screen name="participant-search" options={{ href: null, title: 'Hledat účastníka' }} />
      <Tabs.Screen name="coach-inspiration" options={{ href: null, title: 'Inspirace' }} />
      <Tabs.Screen name="coach-leaderboard" options={{ title: 'Žebříček', tabBarAccessibilityLabel: 'Žebříček' }} />
      <Tabs.Screen name="coach-profile" options={{ title: 'Profil', tabBarAccessibilityLabel: 'Profil' }} />
    </Tabs>
  );
}

function CoachHeaderBackground() {
  return <View style={styles.headerBackground} />;
}

function CoachTabBarBackground() {
  return <View pointerEvents="none" style={styles.tabBarBackground} />;
}

function CoachTabIcon({ name, focused, color }: { name: MaterialIconName; focused: boolean; color: string }) {
  return (
    <View style={[styles.tabIconShell, focused && styles.tabIconShellActive]}>
      <MaterialCommunityIcons name={name} size={23} color={focused ? '#fff' : color} />
      {focused ? <View style={styles.tabIconDot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CoachColors.bg,
    borderBottomWidth: 1,
    borderBottomColor: CoachColors.border,
  },
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 30,
  },
  tabIconShell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CoachColors.border,
    backgroundColor: 'rgba(255,255,255,0.66)',
  },
  tabIconShellActive: {
    backgroundColor: CoachColors.slate,
    borderColor: CoachColors.slate,
  },
  tabIconDot: {
    position: 'absolute',
    bottom: 5,
    width: 12,
    height: 2,
    borderRadius: 1,
    backgroundColor: CoachColors.amber,
  },
});
