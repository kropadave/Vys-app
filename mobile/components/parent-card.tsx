import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Shadow, Spacing } from '@/lib/theme';

export function ParentCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  return (
    <View style={[styles.pill, tone === 'success' && styles.success, tone === 'warning' && styles.warning, tone === 'danger' && styles.danger, tone === 'info' && styles.info]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.card,
  },
  title: { color: Palette.text, fontSize: 18, fontWeight: '900' },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  success: { backgroundColor: Palette.successSoft, borderColor: 'rgba(49,217,139,0.34)' },
  warning: { backgroundColor: Palette.accentSoft, borderColor: 'rgba(255,178,26,0.34)' },
  danger: { backgroundColor: Palette.dangerSoft, borderColor: 'rgba(255,91,110,0.34)' },
  info: { backgroundColor: Palette.cyanSoft, borderColor: 'rgba(20,200,255,0.34)' },
  pillText: { color: Palette.text, fontSize: 12, fontWeight: '900' },
});
