import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Palette, Radius, Shadow } from '@/lib/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  gradient?: readonly [string, string, ...string[]];
  surface?: 'white' | 'soft';
  pad?: number;
  radius?: number;
};

/**
 * Univerzální zaoblená karta v stylu hravého fialového vibu.
 * - výchozí: bílá karta s jemným stínem
 * - `gradient` přepne na barevný gradient (např. hero karta)
 */
export function Card({
  children,
  style,
  gradient,
  surface = 'white',
  pad = 16,
  radius = Radius.lg,
}: Props) {
  const baseStyle: ViewStyle = {
    borderRadius: radius,
    padding: pad,
    backgroundColor: surface === 'white' ? Palette.surface : Palette.surfaceAlt,
    ...Shadow.card,
  };

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: radius, padding: pad }, style as ViewStyle]}
      >
        {children}
      </LinearGradient>
    );
  }

  return <View style={[baseStyle, style as ViewStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  gradient: {
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
});
