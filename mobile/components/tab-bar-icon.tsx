import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, type ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    Easing,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { Brand } from '@/lib/brand';

export type TabIconName =
  | 'overview'
  | 'skill-tree'
  | 'rewards'
  | 'leaderboard'
  | 'participants'
  | 'payments'
  | 'documents'
  | 'profile'
  | 'attendance'
  | 'qr'
  | 'wards';

type Props = {
  name: TabIconName;
  focused: boolean;
  color: string;
};

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type IconTheme = {
  icon: MaterialIconName;
  primary: string;
  soft: string;
  border: string;
  halo: string;
  spark: string;
  gradient: readonly [string, string];
};

const iconThemes: Record<TabIconName, IconTheme> = {
  overview: { icon: 'view-dashboard-outline', primary: Brand.cyan, soft: 'rgba(20,200,255,0.13)', border: 'rgba(20,200,255,0.28)', halo: 'rgba(20,200,255,0.26)', spark: 'rgba(255,255,255,0.88)', gradient: [Brand.cyan, Brand.purple] },
  rewards: { icon: 'gift-outline', primary: Brand.orange, soft: 'rgba(255,178,26,0.14)', border: 'rgba(255,178,26,0.30)', halo: 'rgba(255,178,26,0.28)', spark: 'rgba(255,255,255,0.86)', gradient: [Brand.orange, Brand.pink] },
  'skill-tree': { icon: 'transit-connection-variant', primary: Brand.purple, soft: 'rgba(139,29,255,0.14)', border: 'rgba(139,29,255,0.32)', halo: 'rgba(139,29,255,0.30)', spark: 'rgba(255,255,255,0.88)', gradient: [Brand.purple, Brand.pink] },
  leaderboard: { icon: 'podium-gold', primary: Brand.pink, soft: 'rgba(241,43,179,0.13)', border: 'rgba(241,43,179,0.30)', halo: 'rgba(241,43,179,0.28)', spark: 'rgba(255,255,255,0.86)', gradient: [Brand.pink, Brand.orange] },
  participants: { icon: 'account-group-outline', primary: Brand.cyanDeep, soft: 'rgba(20,200,255,0.12)', border: 'rgba(20,200,255,0.26)', halo: 'rgba(20,200,255,0.24)', spark: 'rgba(255,255,255,0.86)', gradient: [Brand.cyan, Brand.mint] },
  payments: { icon: 'credit-card-outline', primary: Brand.orangeDeep, soft: 'rgba(255,178,26,0.13)', border: 'rgba(255,178,26,0.28)', halo: 'rgba(255,178,26,0.24)', spark: 'rgba(255,255,255,0.86)', gradient: [Brand.orange, Brand.orangeDeep] },
  documents: { icon: 'file-check-outline', primary: Brand.pinkDeep, soft: 'rgba(241,43,179,0.12)', border: 'rgba(241,43,179,0.26)', halo: 'rgba(241,43,179,0.24)', spark: 'rgba(255,255,255,0.86)', gradient: [Brand.pink, Brand.purple] },
  profile: { icon: 'account-circle-outline', primary: Brand.purpleDeep, soft: 'rgba(139,29,255,0.12)', border: 'rgba(139,29,255,0.26)', halo: 'rgba(139,29,255,0.24)', spark: 'rgba(255,255,255,0.86)', gradient: [Brand.purple, Brand.purpleDeep] },
  attendance: { icon: 'calendar-check-outline', primary: Brand.limeDeep, soft: 'rgba(255,216,74,0.16)', border: 'rgba(255,216,74,0.32)', halo: 'rgba(255,216,74,0.28)', spark: 'rgba(255,255,255,0.86)', gradient: [Brand.lime, Brand.orange] },
  qr: { icon: 'qrcode-scan', primary: Brand.purple, soft: 'rgba(139,29,255,0.13)', border: 'rgba(139,29,255,0.28)', halo: 'rgba(139,29,255,0.26)', spark: 'rgba(255,255,255,0.86)', gradient: [Brand.purple, Brand.cyan] },
  wards: { icon: 'account-heart-outline', primary: Brand.pinkDeep, soft: 'rgba(241,43,179,0.12)', border: 'rgba(241,43,179,0.26)', halo: 'rgba(241,43,179,0.24)', spark: 'rgba(255,255,255,0.86)', gradient: [Brand.pink, Brand.orange] },
};

export function TabBarIcon({ name, focused, color }: Props) {
  const progress = useSharedValue(focused ? 1 : 0);
  const burst = useSharedValue(0);
  const theme = iconThemes[name];
  const iconSize = 22;
  const iconColor = focused ? Brand.white : theme.primary || color;

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, { damping: 13, stiffness: 260, mass: 0.78 });

    if (focused) {
      burst.value = 0;
      burst.value = withSequence(
        withTiming(1, { duration: 170, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 520, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      burst.value = withTiming(0, { duration: 120 });
    }
  }, [burst, focused, progress]);

  const itemAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + 0.02 * burst.value },
    ],
  }));

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.28 + burst.value * 0.12,
    transform: [{ scale: 0.7 + progress.value * 0.18 + burst.value * 0.12 }],
  }));

  const shellAnimatedStyle = useAnimatedStyle(() => ({
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.soft, 'rgba(255,255,255,0.18)']),
    shadowOpacity: 0.03 + progress.value * 0.12,
    shadowRadius: 7 + progress.value * 10,
    transform: [{ rotate: `${burst.value * -1.5}deg` }],
  }));

  const shineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: burst.value,
    transform: [{ translateX: -44 + burst.value * 92 }, { rotate: '-18deg' }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${burst.value * 10 - progress.value * 2}deg` }, { scale: 0.96 + progress.value * 0.1 }],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: 4 - progress.value * 3 }, { scaleX: 0.45 + progress.value * 0.45 }],
  }));

  return (
    <Animated.View style={[styles.item, itemAnimatedStyle]}>
      <Animated.View style={[styles.halo, { backgroundColor: theme.halo }, haloAnimatedStyle]} />
      <Animated.View
        style={[
          styles.shell,
          { borderColor: focused ? 'rgba(255,255,255,0.78)' : theme.border, shadowColor: theme.primary },
          shellAnimatedStyle,
        ]}>
        {focused ? <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
        <Animated.View style={[styles.shine, { backgroundColor: theme.spark }, shineAnimatedStyle]} />
        <Animated.View style={iconAnimatedStyle}>
          <MaterialCommunityIcons name={theme.icon} size={iconSize} color={iconColor} />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.activeDot, { backgroundColor: theme.primary }, dotAnimatedStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  shine: {
    position: 'absolute',
    width: 20,
    height: 92,
    opacity: 0,
  },
  activeDot: {
    width: 18,
    height: 3,
    borderRadius: 3,
    marginTop: 3,
  },
});