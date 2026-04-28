import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRole } from '@/hooks/use-role';
import { Palette, Radius, Spacing } from '@/lib/theme';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
};

export function PlaceholderScreen({ eyebrow, title, description, bullets }: Props) {
  const router = useRouter();
  const { setRole } = useRole();

  async function switchRole() {
    await setRole(null);
    router.replace('/sign-in');
  }

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {bullets && bullets.length > 0 && (
        <View style={styles.bullets}>
          {bullets.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <View style={styles.dot} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )}

      <Pressable style={styles.button} onPress={switchRole}>
        <Text style={styles.buttonText}>Změnit roli</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.xl, paddingTop: 64, gap: Spacing.lg },
  eyebrow: {
    color: Palette.primary,
    fontWeight: '900',
    letterSpacing: 3,
    fontSize: 12,
  },
  title: { color: Palette.text, fontSize: 26, fontWeight: '900' },
  description: { color: Palette.textMuted, fontSize: 15, lineHeight: 22 },
  bullets: {
    gap: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.primary,
    marginTop: 7,
  },
  bulletText: { color: Palette.text, fontSize: 14, lineHeight: 20, flex: 1 },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.border,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    marginTop: Spacing.md,
  },
  buttonText: { color: Palette.text, fontWeight: '700' },
});
