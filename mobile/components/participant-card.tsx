import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius, Shadow, Spacing } from '@/lib/theme';

export function ParticipantCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
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
});
