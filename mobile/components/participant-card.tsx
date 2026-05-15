import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { BlobShape } from '@/components/brand/floating-shapes';
import { Brand, BrandGradient } from '@/lib/brand';
import { Palette, Radius, Shadow, Spacing } from '@/lib/theme';

type Variant = 'plain' | 'gradient' | 'soft';

type Props = {
  title?: string;
  subtitle?: string;
  variant?: Variant;
  gradient?: readonly [string, string, ...string[]];
  pattern?: boolean;
  accent?: string;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function ParticipantCard({
  title,
  subtitle,
  variant = 'plain',
  gradient,
  pattern = false,
  accent,
  children,
  style,
}: Props) {
  if (variant === 'gradient') {
    const colors = gradient ?? BrandGradient.game;
    return (
      <View style={[styles.card, styles.gradientCard, style]}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {pattern ? (
          <>
            <BlobShape size={200} color="#FFFFFF" opacity={0.18} style={{ position: 'absolute', top: -60, right: -40 }} />
            <BlobShape size={140} color="#FFFFFF" opacity={0.12} style={{ position: 'absolute', bottom: -40, left: -30 }} />
          </>
        ) : null}
        <View style={styles.gradientInner}>
          {title ? <Text style={styles.gradientTitle}>{title}</Text> : null}
          {subtitle ? <Text style={styles.gradientSubtitle}>{subtitle}</Text> : null}
          {children}
        </View>
      </View>
    );
  }

  if (variant === 'soft') {
    return (
      <View style={[styles.card, styles.softCard, style]}>
        {accent ? <View style={[styles.accentBar, { backgroundColor: accent }]} /> : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {accent ? <View style={[styles.accentBar, { backgroundColor: accent }]} /> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

void Brand;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
    ...Shadow.soft,
  },
  softCard: {
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.border,
  },
  gradientCard: {
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'transparent',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  gradientInner: { gap: Spacing.md, position: 'relative' },
  gradientTitle: { color: '#fff', fontSize: 19, fontWeight: '900' },
  gradientSubtitle: { color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '800' },
  title: { color: Palette.text, fontSize: 18, fontWeight: '900' },
  subtitle: { color: Palette.textMuted, fontSize: 13, fontWeight: '700' },
});
