import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ArrowRightIcon,
  BoltIcon,
  LockIcon,
  MedalIcon,
  StarIcon,
  TrophyIcon,
} from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  COACH_BADGES,
  LEADERBOARD,
  MOCK_COACH,
  type CoachBadge,
  type LeaderboardRow,
} from '@/lib/data/coach';
import { Gradients, Palette, Radius, Spacing } from '@/lib/theme';

export default function GamificationScreen() {
  const router = useRouter();
  const c = MOCK_COACH;
  const myRank = LEADERBOARD.findIndex((r) => r.coachId === c.id) + 1;
  const unlocked = COACH_BADGES.filter((b) => b.unlocked).length;

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Zpět</Text>
      </Pressable>

      <Text style={styles.h1}>Gamifikace</Text>

      <Card gradient={Gradients.hero} pad={20} radius={Radius.xl}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={styles.rankCircle}>
            <Text style={styles.rankNumber}>{myRank}.</Text>
            <Text style={styles.rankLabel}>místo</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Skvělá práce, {c.nickname}!</Text>
            <Text style={styles.heroSub}>{c.unlocksThisMonth} odemčení tento měsíc</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <Pill label={`★ ${c.rating}`} variant="yellow" icon={<StarIcon size={14} />} />
              <Pill label={`${unlocked}/${COACH_BADGES.length} odznaků`} variant="soft" icon={<MedalIcon size={14} />} />
            </View>
          </View>
        </View>
      </Card>

      {/* Leaderboard */}
      <Text style={styles.sectionTitle}>Žebříček trenérů – tento měsíc</Text>
      <View style={{ gap: 8 }}>
        {LEADERBOARD.map((row, i) => (
          <LeaderboardItem key={row.coachId} row={row} rank={i + 1} highlight={row.coachId === c.id} />
        ))}
      </View>

      {/* Badges */}
      <Text style={styles.sectionTitle}>Odznaky</Text>
      <View style={styles.badgeGrid}>
        {COACH_BADGES.map((b) => (
          <BadgeCard key={b.id} badge={b} />
        ))}
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

function LeaderboardItem({ row, rank, highlight }: { row: LeaderboardRow; rank: number; highlight: boolean }) {
  return (
    <Card pad={12} radius={Radius.lg} style={highlight ? { borderWidth: 2, borderColor: Palette.primary500 } : undefined}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={[styles.rankBadge, rank <= 3 && styles.rankBadgeTop]}>
          {rank <= 3 ? (
            <TrophyIcon size={20} />
          ) : (
            <Text style={styles.rankBadgeText}>{rank}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.lbName, highlight && { color: Palette.primary700 }]}>
            {row.name} {highlight && '(ty)'}
          </Text>
          <Text style={styles.lbSub}>{row.city} · ★ {row.rating}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.lbValue}>{row.unlocksThisMonth}</Text>
          <Text style={styles.lbLabel}>odemčení</Text>
        </View>
      </View>
    </Card>
  );
}

function BadgeCard({ badge }: { badge: CoachBadge }) {
  return (
    <View style={[styles.badgeCard, !badge.unlocked && styles.badgeLocked]}>
      <View style={[styles.badgeIcon, !badge.unlocked && { backgroundColor: Palette.surfaceAlt }]}>
        {badge.unlocked ? <MedalIcon size={36} /> : <LockIcon size={28} />}
      </View>
      <Text style={[styles.badgeName, !badge.unlocked && { color: Palette.textMuted }]} numberOfLines={1}>
        {badge.name}
      </Text>
      <Text style={styles.badgeDesc} numberOfLines={2}>{badge.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.lg },
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: Palette.primary700, fontWeight: '700' },
  h1: { fontSize: 28, fontWeight: '800', color: Palette.text },

  rankCircle: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  rankNumber: { color: Palette.surface, fontSize: 26, fontWeight: '800' },
  rankLabel: { color: Palette.surface, opacity: 0.9, fontSize: 11 },
  heroTitle: { color: Palette.surface, fontSize: 18, fontWeight: '800' },
  heroSub: { color: Palette.surface, opacity: 0.9, marginTop: 2 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: Palette.text },

  rankBadge: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.primary50,
    alignItems: 'center', justifyContent: 'center',
  },
  rankBadgeTop: { backgroundColor: Palette.accentYellow },
  rankBadgeText: { fontWeight: '800', color: Palette.primary700 },

  lbName: { fontWeight: '800', color: Palette.text },
  lbSub: { color: Palette.textMuted, marginTop: 2, fontSize: 12 },
  lbValue: { fontWeight: '800', color: Palette.text, fontSize: 16 },
  lbLabel: { color: Palette.textMuted, fontSize: 11 },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: {
    width: '48%', backgroundColor: Palette.surface, borderRadius: Radius.lg, padding: 14,
    alignItems: 'center', gap: 6,
  },
  badgeLocked: { opacity: 0.7 },
  badgeIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Palette.primary50,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeName: { fontWeight: '800', color: Palette.text },
  badgeDesc: { color: Palette.textMuted, fontSize: 12, textAlign: 'center' },

  arrow: { color: Palette.primary700 },
});
