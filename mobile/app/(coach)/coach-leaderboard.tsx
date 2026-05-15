import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CoachCard, CoachPageHeader } from '@/components/coach/coach-screen';
import { StatusPill } from '@/components/parent-card';
import { useAuth } from '@/hooks/use-auth';
import { useCoachLeaderboard } from '@/hooks/use-leaderboard';
import { useManualTrickAwards } from '@/hooks/use-manual-trick-awards';
import { CoachColors } from '@/lib/coach-theme';
import { skillTreeTricks } from '@/lib/participant-content';
import { Radius, Spacing } from '@/lib/theme';

const MONTHLY_MILESTONES = [
  { xp: 500,  reward: '100 Kč', amount: 100 },
  { xp: 1200, reward: '200 Kč', amount: 200 },
  { xp: 2500, reward: '300 Kč', amount: 300 },
  { xp: 4000, reward: '400 Kč', amount: 400 },
  { xp: 6000, reward: '500 Kč', amount: 500 },
];

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function CoachLeaderboard() {
  const [showPath, setShowPath] = useState(false);
  const { session } = useAuth();
  const { awards } = useManualTrickAwards();
  const { entries: coachLeaderboard } = useCoachLeaderboard(session?.userId);

  const monthlyXp = useMemo(() => {
    const monthKey = currentMonthKey();
    return awards
      .filter((a) => a.awardedAt.startsWith(monthKey))
      .reduce((sum, a) => {
        const trick = skillTreeTricks.find((t) => t.id === a.trickId);
        return sum + (trick?.xp ?? 0);
      }, 0);
  }, [awards]);

  const milestones = MONTHLY_MILESTONES.map((m) => ({ ...m, unlocked: monthlyXp >= m.xp }));
  const totalBonus = milestones.filter((m) => m.unlocked).reduce((sum, m) => sum + m.amount, 0);
  const nextMilestone = milestones.find((m) => !m.unlocked);
  const now = new Date();
  const monthLabel = now.toLocaleString('cs-CZ', { month: 'long', year: 'numeric' });

  return (
    <>
      <ScrollView style={styles.page} contentContainerStyle={styles.container}>
        <CoachPageHeader
          kicker="Trenér · Progres"
          title="Žebříček a odměny"
          subtitle="Přehled výkonu trenérů, měsíčních XP a bonusů bez herního balastu."
          icon="bar-chart-2"
          metrics={[
            { label: 'Moje XP tento měsíc', value: String(monthlyXp), tone: 'blue' },
            { label: 'Bonus', value: `${totalBonus} Kč`, tone: 'teal' },
            { label: 'Další meta', value: nextMilestone ? `${nextMilestone.xp - monthlyXp} XP` : 'Hotovo', tone: nextMilestone ? 'amber' : 'teal' },
          ]}
        />

        <CoachCard title="Leaderboard trenérů">
          {coachLeaderboard.map((coach) => (
            <View key={coach.name} style={styles.row}>
              <Text style={styles.rank}>{coach.rank}</Text>
              <View style={[styles.avatar, { backgroundColor: coach.avatarColor }]}>
                <Text style={styles.avatarText}>{coach.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{coach.name}</Text>
                <Text style={styles.muted}>{coach.qr} potvrzení · {coach.xp} XP</Text>
              </View>
              <StatusPill label={coach.bonus} tone={coach.isMe ? 'success' : 'neutral'} />
            </View>
          ))}
        </CoachCard>

        <CoachCard title="Cesta odměn za triky" subtitle="Každý měsíc se cesta obnovuje podle triků udělených svěřencům.">
          <Text style={styles.muted}>Každý měsíc se cesta obnovuje. XP jsou za triky, které jsi tento měsíc udělil svěřencům.</Text>
          <View style={styles.xpRow}>
            <Text style={styles.xpValue}>{monthlyXp} XP</Text>
            <Text style={styles.muted}>{monthLabel}</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.86 }]} onPress={() => setShowPath(true)}>
            <Text style={styles.primaryButtonText}>Zobrazit cestu</Text>
          </Pressable>
        </CoachCard>
      </ScrollView>

      <Modal visible={showPath} transparent animationType="fade" onRequestClose={() => setShowPath(false)}>
        <View style={[StyleSheet.absoluteFill, styles.modalBackdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPath(false)} />
          <View style={styles.overlay} pointerEvents="box-none">
            <View style={styles.overlayCard}>

              {/* Header */}
              <View style={styles.overlayHeader}>
                <View style={styles.overlayHeaderLeft}>
                  <View style={styles.trophyBadge}>
                    <Feather name="award" size={18} color={CoachColors.amber} />
                  </View>
                  <View>
                    <Text style={styles.overlayTitle}>Cesta odměn</Text>
                    <Text style={styles.muted}>{monthLabel}</Text>
                  </View>
                </View>
                <Pressable onPress={() => setShowPath(false)} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
                  <Feather name="x" size={16} color={CoachColors.slateMuted} />
                </Pressable>
              </View>

              {/* XP hero */}
              <View style={styles.xpHero}>
                <Text style={styles.xpHeroValue}>{monthlyXp} <Text style={styles.xpHeroUnit}>XP</Text></Text>
                <Text style={styles.xpHeroLabel}>tento měsíc</Text>
              </View>

              {/* Progress to next milestone */}
              {nextMilestone ? (
                <View style={styles.progressSection}>
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressLabelText}>Do dalšího bonusu</Text>
                    <Text style={styles.progressLabelValue}>{nextMilestone.xp - monthlyXp} XP</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(100, Math.round((monthlyXp / nextMilestone.xp) * 100))}%` as any }]} />
                  </View>
                </View>
              ) : (
                <View style={styles.allUnlockedBadge}>
                  <Feather name="star" size={14} color={CoachColors.amber} />
                  <Text style={styles.allUnlockedText}>Všechny bonusy odemknuty!</Text>
                </View>
              )}

              {/* Total earned */}
              {totalBonus > 0 && (
                <View style={styles.totalBonusRow}>
                  <Text style={styles.totalBonusLabel}>Celkem bonus</Text>
                  <Text style={styles.totalBonusValue}>+{totalBonus} Kč</Text>
                </View>
              )}

              {/* Milestone list */}
              <ScrollView contentContainerStyle={styles.pathContent} showsVerticalScrollIndicator={false}>
                {[...milestones].reverse().map((m, idx, arr) => (
                  <View key={m.xp} style={styles.milestoneRow}>
                    <View style={styles.milestoneTrack}>
                      <View style={[styles.milestoneDot, m.unlocked && styles.milestoneDotUnlocked]}>
                        <Feather name={m.unlocked ? 'check' : 'lock'} size={9} color={m.unlocked ? '#fff' : CoachColors.slateMuted} />
                      </View>
                      {idx < arr.length - 1 && (
                        <View style={[styles.trackLine, m.unlocked && styles.trackLineUnlocked]} />
                      )}
                    </View>
                    <View style={styles.milestoneContent}>
                      <Text style={[styles.milestoneReward, m.unlocked && styles.milestoneRewardUnlocked]}>{m.reward}</Text>
                      <Text style={styles.milestoneXp}>{m.xp.toLocaleString('cs-CZ')} XP tento měsíc</Text>
                    </View>
                    <StatusPill label={m.unlocked ? 'Splněno' : 'Čeká'} tone={m.unlocked ? 'success' : 'warning'} />
                  </View>
                ))}
              </ScrollView>

            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: CoachColors.bg },
  container: { width: '100%', maxWidth: 860, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 104 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  rank: { color: CoachColors.amber, width: 24, fontSize: 24, fontWeight: '900' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  cardTitle: { color: CoachColors.slate, fontSize: 17, lineHeight: 23, fontWeight: '900' },
  muted: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19 },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  xpValue: { color: CoachColors.blue, fontSize: 28, fontWeight: '900' },
  primaryButton: { alignSelf: 'flex-start', backgroundColor: CoachColors.slate, borderRadius: 999, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  primaryButtonText: { color: '#fff', fontWeight: '900' },
  // modal
  modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.55)' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  overlayCard: { width: '100%', maxWidth: 480, backgroundColor: CoachColors.bg, borderRadius: Radius.xxl, padding: Spacing.lg, gap: Spacing.md, maxHeight: '88%' },
  overlayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overlayHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  trophyBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: CoachColors.amberSoft, alignItems: 'center', justifyContent: 'center' },
  overlayTitle: { color: CoachColors.slate, fontSize: 20, fontWeight: '900', lineHeight: 26 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: CoachColors.panelAlt, alignItems: 'center', justifyContent: 'center' },
  // xp hero
  xpHero: { backgroundColor: CoachColors.blueSoft, borderRadius: Radius.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, alignItems: 'center' },
  xpHeroValue: { color: CoachColors.blue, fontSize: 38, fontWeight: '900', lineHeight: 44 },
  xpHeroUnit: { fontSize: 20, fontWeight: '700' },
  xpHeroLabel: { color: CoachColors.slateMuted, fontSize: 13, marginTop: 2 },
  // progress
  progressSection: { gap: 6 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabelText: { color: CoachColors.slateMuted, fontSize: 12 },
  progressLabelValue: { color: CoachColors.blue, fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: CoachColors.panelAlt, borderRadius: Radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: CoachColors.blue, borderRadius: Radius.pill },
  // all unlocked
  allUnlockedBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: CoachColors.amberSoft, borderRadius: Radius.md, padding: Spacing.sm },
  allUnlockedText: { color: CoachColors.amber, fontSize: 13, fontWeight: '700' },
  // total bonus
  totalBonusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: CoachColors.tealSoft, borderRadius: Radius.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  totalBonusLabel: { color: CoachColors.teal, fontSize: 13, fontWeight: '700' },
  totalBonusValue: { color: CoachColors.teal, fontSize: 20, fontWeight: '900' },
  // milestone list
  pathContent: { gap: 0, paddingVertical: Spacing.xs },
  milestoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, minHeight: 56 },
  milestoneTrack: { alignItems: 'center', width: 24, paddingTop: 4 },
  milestoneDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  milestoneDotUnlocked: { backgroundColor: CoachColors.teal, borderColor: CoachColors.teal },
  trackLine: { width: 2, flex: 1, backgroundColor: CoachColors.border, marginTop: 3 },
  trackLineUnlocked: { backgroundColor: CoachColors.teal },
  milestoneContent: { flex: 1, paddingTop: 2 },
  milestoneReward: { color: CoachColors.slateMuted, fontSize: 17, fontWeight: '900', lineHeight: 23 },
  milestoneRewardUnlocked: { color: CoachColors.slate },
  milestoneXp: { color: CoachColors.slateMuted, fontSize: 12, marginTop: 1 },
});