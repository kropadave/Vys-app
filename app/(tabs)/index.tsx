import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  ACHIEVEMENTS,
  KROUZKY,
  MOCK_PARTICIPANT,
  TRICKS,
  currentBracelet,
  masteredTricksCount,
  nextBracelet,
  unreadNotificationsCount,
} from '@/lib/data/mock';
import { Gradients, Palette, Radius, Spacing } from '@/lib/theme';

export default function HomeScreen() {
  const p = MOCK_PARTICIPANT;
  const bracelet = currentBracelet(p.currentBraceletLevel);
  const next = nextBracelet(p.currentBraceletLevel);
  const progress = next
    ? Math.max(0, Math.min(1, (p.xp - bracelet.xpRequired) / (next.xpRequired - bracelet.xpRequired)))
    : 1;
  const successRate = Math.round((masteredTricksCount() / TRICKS.length) * 100);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={{ backgroundColor: Palette.bg }}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar: měna XP + avatar */}
      <View style={styles.topBar}>
        <View style={styles.xpBadge}>
          <Text style={styles.xpEmoji}>⚡</Text>
          <Text style={styles.xpText}>{p.xp}</Text>
        </View>

        <Link href="/notifications" asChild>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize: 18 }}>
              🔔{unreadNotificationsCount() > 0 ? ` ${unreadNotificationsCount()}` : ''}
            </Text>
          </TouchableOpacity>
        </Link>

        <Link href="/(tabs)/profile" asChild>
          <TouchableOpacity style={styles.avatarBtn}>
            <Text style={{ fontSize: 24 }}>{p.avatarEmoji}</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Hero karta s úrovní */}
      <Card gradient={Gradients.hero} pad={20} radius={Radius.xl}>
        <View style={styles.heroRow}>
          <View style={styles.mascot}>
            <Text style={{ fontSize: 64 }}>🥷</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.heroLabel}>Tvoje úroveň</Text>
            <Text style={styles.heroTitle}>{bracelet.name}</Text>
            <Text style={styles.heroSub}>{p.xp} XP nasbíráno</Text>

            <View style={styles.heroProgressBg}>
              <View style={[styles.heroProgressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.heroSub}>{successRate}% triků zvládnuto</Text>
          </View>
        </View>
      </Card>

      {/* Aktivní kroužky */}
      <SectionHeader title="Tvůj kroužek" actionHref="/krouzky" actionLabel="Všechny" />
      <ActiveCourseCard />

      {/* Achievementy / odznaky */}
      <SectionHeader title="Tvoje odznaky" actionHref="/(tabs)/achievements" actionLabel="Více" />
      <View style={styles.achievementsRow}>
        {ACHIEVEMENTS.slice(0, 4).map((a) => (
          <View key={a.id} style={[styles.achievement, !a.unlocked && { opacity: 0.45 }]}>
            <View style={styles.achievementIcon}>
              <Text style={{ fontSize: 28 }}>{a.unlocked ? a.icon : '🔒'}</Text>
            </View>
            <Text style={styles.achievementLabel} numberOfLines={2}>
              {a.name}
            </Text>
          </View>
        ))}
      </View>

      {/* Mini info: další trik k odemčení */}
      <SectionHeader title="Co odemknout dál" actionHref="/(tabs)/tricks" actionLabel="Skill tree" />
      {TRICKS.filter((t) => t.status === 'available' || t.status === 'in_progress')
        .slice(0, 2)
        .map((t) => (
          <Card key={t.id} pad={14}>
            <View style={styles.trickRow}>
              <View style={styles.trickEmoji}>
                <Text style={{ fontSize: 22 }}>{t.status === 'in_progress' ? '⏳' : '🎯'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trickName}>{t.name}</Text>
                <Text style={styles.muted} numberOfLines={1}>
                  {t.description}
                </Text>
              </View>
              <Pill label={`+${t.xp} XP`} variant="soft" />
            </View>
          </Card>
        ))}

      <View style={{ height: 110 }} />
    </ScrollView>
  );
}

function SectionHeader({
  title,
  actionHref,
  actionLabel,
}: {
  title: string;
  actionHref?: any;
  actionLabel?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionHref && actionLabel && (
        <Link href={actionHref}>
          <Text style={styles.sectionAction}>{actionLabel} →</Text>
        </Link>
      )}
    </View>
  );
}

function ActiveCourseCard() {
  const p = MOCK_PARTICIPANT;
  const k = KROUZKY.find((x) => x.city === p.city) ?? KROUZKY[0];
  return (
    <Card pad={16}>
      <View style={styles.courseRow}>
        <View style={styles.courseIcon}>
          <Text style={{ fontSize: 28 }}>🤸</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.courseTitle}>
            {k.city} · {k.venue}
          </Text>
          <Text style={styles.muted}>
            {k.day} {k.timeFrom}–{k.timeTo} · {k.ageGroup}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            <Pill label={`od ${k.priceFrom} Kč`} variant="yellow" emoji="💰" />
            <Pill label="Probíhá" variant="mint" />
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Palette.surface,
    borderRadius: Radius.pill,
    flex: 1,
    alignSelf: 'flex-start',
    maxWidth: 120,
    shadowColor: Palette.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  xpEmoji: { fontSize: 18 },
  xpText: { fontSize: 16, fontWeight: '800', color: Palette.text },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mascot: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  heroProgressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginTop: 8,
  },
  heroProgressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },

  // Sekce
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Palette.text },
  sectionAction: { color: Palette.primary600, fontWeight: '700', fontSize: 13 },

  // Course
  courseRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  courseIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Palette.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseTitle: { fontSize: 16, fontWeight: '700', color: Palette.text },

  // Achievements
  achievementsRow: { flexDirection: 'row', gap: 10 },
  achievement: { flex: 1, alignItems: 'center', gap: 6 },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  achievementLabel: { fontSize: 11, color: Palette.text, textAlign: 'center', fontWeight: '600' },

  // Tricky
  trickRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  trickEmoji: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trickName: { fontSize: 14, fontWeight: '700', color: Palette.text },

  muted: { color: Palette.textMuted, fontSize: 12 },
});
