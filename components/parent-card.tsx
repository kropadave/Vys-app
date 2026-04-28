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

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return (
    <View style={[styles.pill, tone === 'success' && styles.success, tone === 'warning' && styles.warning, tone === 'danger' && styles.danger]}>
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
  success: { backgroundColor: '#163629', borderColor: '#235D46' },
  warning: { backgroundColor: Palette.accentSoft, borderColor: '#6B5117' },
  danger: { backgroundColor: '#3B1720', borderColor: '#70283A' },
  pillText: { color: Palette.text, fontSize: 12, fontWeight: '900' },
});
