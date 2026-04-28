import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Palette, Radius } from '@/lib/theme';

type Props = {
  label: string;
  emoji?: string;
  variant?: 'primary' | 'soft' | 'yellow' | 'mint' | 'pink' | 'plain';
  style?: ViewStyle | ViewStyle[];
};

const VARIANTS: Record<NonNullable<Props['variant']>, { bg: string; fg: string }> = {
  primary: { bg: Palette.primary500, fg: Palette.textOnPrimary },
  soft: { bg: Palette.primary100, fg: Palette.primary700 },
  yellow: { bg: Palette.accentYellow, fg: Palette.textOnAccent },
  mint: { bg: Palette.accentMint, fg: '#0F5132' },
  pink: { bg: Palette.accentPink, fg: '#7A1F4D' },
  plain: { bg: 'rgba(124, 92, 255, 0.10)', fg: Palette.primary700 },
};

export function Pill({ label, emoji, variant = 'soft', style }: Props) {
  const v = VARIANTS[variant];
  return (
    <View style={[styles.base, { backgroundColor: v.bg }, style as ViewStyle]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.label, { color: v.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 6,
    alignSelf: 'flex-start',
  },
  emoji: { fontSize: 14 },
  label: { fontSize: 13, fontWeight: '700' },
});
