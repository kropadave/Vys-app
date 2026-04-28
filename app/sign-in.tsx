import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRole, type AppRole } from '@/hooks/use-role';
import { Palette, Radius, Spacing } from '@/lib/theme';

type RoleOption = {
  role: AppRole;
  title: string;
  subtitle: string;
  description: string;
  route: string;
};

const ROLES: RoleOption[] = [
  {
    role: 'participant',
    title: 'Účastník',
    subtitle: 'Skill tree, XP, náramky',
    description: 'Tvoje osobní cesta parkourem - triky, odznaky, tvůj kroužek.',
    route: '/home',
  },
  {
    role: 'parent',
    title: 'Rodič',
    subtitle: 'Děti, rezervace, platby',
    description: 'Přehled přihlášek, plateb a progresu tvojich dětí.',
    route: '/(parent)',
  },
  {
    role: 'coach',
    title: 'Trenér',
    subtitle: 'Docházka, QR, svěřenci',
    description: 'Dnešní skupiny, NFC/QR docházka, odemykání triků a výplaty.',
    route: '/(coach)',
  },
];

export default function SignInScreen() {
  const router = useRouter();
  const { setRole } = useRole();
  const [pending, setPending] = useState<AppRole | null>(null);

  async function chooseRole(option: RoleOption) {
    setPending(option.role);
    await setRole(option.role);
    router.replace(option.route as never);
  }

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>TEAMVYS</Text>
        <Text style={styles.title}>Vyber svůj vstup</Text>
        <Text style={styles.subtitle}>
          Každá role má vlastní dashboard a nástroje.
        </Text>
      </View>

      <View style={styles.grid}>
        {ROLES.map((option) => (
          <Pressable
            key={option.role}
            onPress={() => chooseRole(option)}
            style={({ pressed }) => [
              styles.card,
              pressed && { opacity: 0.85 },
              pending === option.role && styles.cardActive,
            ]}>
            <Text style={styles.cardTitle}>{option.title}</Text>
            <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
            <Text style={styles.cardBody}>{option.description}</Text>
            <View style={styles.cardCta}>
              <Text style={styles.cardCtaText}>
                {pending === option.role ? 'Otevírám...' : 'Vstoupit'}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Text style={styles.footer}>Přihlášení pro rodiče, účastníky a trenéry.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    paddingTop: 64,
    gap: Spacing.xl,
    minHeight: '100%',
  },
  header: { gap: Spacing.sm },
  brand: {
    color: Palette.primary,
    fontWeight: '900',
    letterSpacing: 4,
    fontSize: 14,
  },
  title: {
    color: Palette.text,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    color: Palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  grid: { gap: Spacing.md },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: Spacing.lg,
    gap: 6,
  },
  cardActive: { borderColor: Palette.primary },
  cardTitle: { color: Palette.text, fontSize: 20, fontWeight: '800' },
  cardSubtitle: { color: Palette.primary, fontSize: 13, fontWeight: '700' },
  cardBody: { color: Palette.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  cardCta: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  cardCtaText: { color: '#fff', fontWeight: '800' },
  footer: {
    color: Palette.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
