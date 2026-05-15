import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AnimatedProgressBar, FadeInUp, PulseGlow } from '@/components/animated/motion';
import { useParticipantProfile } from '@/hooks/use-participant-profile';
import { Brand } from '@/lib/brand';
import {
    daysUntilRewardPathReset,
    earnedYarnBalls,
    rewardPathGoalXp,
    rewardPathMonthLabel,
    rewardPathProgress,
    unlockedChestRewards,
    type MonthlyReward,
} from '@/lib/monthly-rewards';
import { rewardPathForXp } from '@/lib/participant-content';
import { Palette, Radius, Shadow, Spacing } from '@/lib/theme';
import { useBreakpoint } from '@/lib/use-breakpoint';

export default function RewardsScreen() {
  const { isMobile } = useBreakpoint();
  const { profile, profileReady, loading } = useParticipantProfile();

  if (loading || !profileReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#8B1DFF" size="large" />
      </View>
    );
  }

  const rewardPath = rewardPathForXp(profile.xp);
  const progress = rewardPathProgress(profile.xp);
  const goalXp = rewardPathGoalXp();
  const monthLabel = rewardPathMonthLabel();
  const resetDays = daysUntilRewardPathReset();
  const yarnBalls = earnedYarnBalls(profile.xp);
  const unlockedChests = unlockedChestRewards(profile.xp).length;
  const unlockedCount = rewardPath.filter((reward) => reward.unlocked).length;
  const nextReward = rewardPath.find((reward) => !reward.unlocked);
  const nextChest = rewardPath.find((reward) => !reward.unlocked && reward.kind === 'chest');

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}>
      <FadeInUp>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F7FFFD', '#FFF8EA'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroTopGlow} />
          <View style={styles.kickerRow}>
            <View style={styles.kickerPill}>
              <Text style={styles.kickerText}>{monthLabel}</Text>
            </View>
            <View style={styles.resetChip}>
              <Text style={styles.resetChipText}>Reset za {resetDays} dní</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Quest mapa</Text>

          <View style={styles.heroStatsRow}>
            <HeroStat icon="map-marker-alt" label="Milníky" value={`${unlockedCount}/${rewardPath.length}`} color={Brand.purple} />
            <View style={styles.statDivider} />
            <CoinStat label="Klubíčka" value={yarnBalls} />
            <View style={styles.statDivider} />
            <HeroStat icon="box-open" label="Bedny" value={`${unlockedChests}`} color={Brand.orangeDeep} />
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>{profile.xp} / {goalXp} XP</Text>
              <Text style={styles.progressPercent}>{Math.round(progress * 100)} %</Text>
            </View>
            <AnimatedProgressBar progress={progress} fillColor={Brand.purple} trackColor="rgba(139,29,255,0.12)" height={10} />
            {nextReward
              ? <Text style={styles.nextHint}>{goalDistance(nextReward.xp, profile.xp)} XP do další {nextReward.kind === 'chest' ? 'bedny' : 'odměny'}</Text>
              : <Text style={styles.nextHint}>Cesta dokončena. Nový start 1. {monthLabel.split(' ')[1]}</Text>}
          </View>

            {nextChest ? <ChestPreview reward={nextChest} distance={goalDistance(nextChest.xp, profile.xp)} /> : null}
        </View>
      </FadeInUp>

      <View style={styles.path}>
        <View style={styles.pathLine} />
        {rewardPath.map((reward, index) => {
          const unlocked = reward.unlocked;
          const accent = reward.accent ?? stepColor(index);
          const current = !unlocked && index === unlockedCount;
          return (
            <FadeInUp key={reward.xp} delay={index * 70}>
              <View style={[styles.reward, unlocked && styles.rewardUnlocked, current && styles.currentReward]}>
                {unlocked ? (
                  <PulseGlow scaleTo={1.08} duration={1600}>
                    <StepDot accent={accent} label="✓" unlocked />
                  </PulseGlow>
                ) : (
                  <StepDot accent={accent} label={`${index + 1}`} />
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.rewardHeader}>
                    <Text style={[styles.xpLabel, { color: accent }]}>{reward.xp} XP</Text>
                    <View style={[styles.statusPill, { backgroundColor: unlocked ? hexToSoft(accent, 0.18) : Palette.surfaceAlt }]}>
                      <Text style={[styles.status, { color: unlocked ? accent : Palette.textSubtle }]}>
                        {unlocked ? 'Odemčeno' : current ? 'Další cíl' : 'Zamčeno'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rewardTitleRow}>
                    <View style={[styles.rewardIcon, { backgroundColor: hexToSoft(accent, 0.14) }]}> 
                      <RewardIcon kind={reward.kind} accent={accent} />
                    </View>
                    <Text style={styles.rewardTitle} numberOfLines={2}>{reward.title}</Text>
                  </View>
                </View>
              </View>
            </FadeInUp>
          );
        })}
      </View>
    </ScrollView>
  );
}

function ChestPreview({ reward, distance }: { reward: MonthlyReward; distance: number }) {
  return (
    <View style={styles.chestPreview}>
      <View style={[styles.chestPreviewIcon, { backgroundColor: hexToSoft(reward.accent, 0.16) }]}> 
        <FontAwesome5 name="box-open" size={16} color={reward.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.chestPreviewLabel}>Další bedna</Text>
        <Text style={styles.chestPreviewTitle}>{reward.title}</Text>
      </View>
      <View style={[styles.chestRarityPill, { backgroundColor: hexToSoft(reward.accent, 0.14) }]}> 
        <Text style={[styles.chestRarityText, { color: reward.accent }]}>{distance} XP</Text>
      </View>
    </View>
  );
}

function StepDot({ accent, label, unlocked = false }: { accent: string; label: string; unlocked?: boolean }) {
  return (
    <View style={[styles.stepDot, { backgroundColor: unlocked ? accent : '#FFFFFF', borderColor: unlocked ? accent : hexToSoft(accent, 0.45) }]}> 
      <Text style={[styles.stepDotText, { color: unlocked ? '#FFFFFF' : accent }]}>{label}</Text>
    </View>
  );
}

function HeroStat({ icon, label, value, color }: { icon: ComponentProps<typeof FontAwesome5>['name']; label: string; value: string; color: string }) {
  return (
    <View style={styles.heroStat}>
      <FontAwesome5 name={icon} size={13} color={color} />
      <Text style={[styles.heroStatValue, { color }]}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function YarnBall({ size = 14, color = Brand.orange }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      <Circle cx="10" cy="10" r="9.5" fill={color} />
      <Path d="M 1 10 Q 10 3 19 10" fill="none" stroke="rgba(255,255,255,0.48)" strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M 1 10 Q 10 17 19 10" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="1.4" strokeLinecap="round" />
      <Path d="M 10 1 Q 17 10 10 19" fill="none" stroke="rgba(255,255,255,0.34)" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function CoinStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.heroStat}>
      <YarnBall size={14} color={Brand.orange} />
      <Text style={[styles.heroStatValue, { color: Brand.orange }]}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function RewardIcon({ kind, accent }: { kind: string; accent: string }) {
  if (kind === 'yarn') return <YarnBall size={15} color={accent} />;
  return <FontAwesome5 name={rewardIconName(kind)} size={13} color={accent} />;
}

function rewardIconName(kind: string): ComponentProps<typeof FontAwesome5>['name'] {
  if (kind === 'discount') return 'ticket-alt';
  if (kind === 'chest') return 'box-open';
  if (kind === 'xp') return 'bolt';
  return 'gift';
}

function goalDistance(xp: number, currentXp: number) {
  return Math.max(0, xp - currentXp);
}

function stepColor(i: number) {
  const palette = [Brand.cyan, Brand.purple, Brand.pink, Brand.orange, Brand.mint];
  return palette[i % palette.length];
}

function hexToSoft(hex: string, alpha: number) {
  const v = hex.replace('#', '');
  const expand = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  const r = parseInt(expand.slice(0, 2), 16);
  const g = parseInt(expand.slice(2, 4), 16);
  const b = parseInt(expand.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  page: { backgroundColor: Palette.bg },
  container: { width: '100%', maxWidth: 820, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 104 },
  containerMobile: { padding: 12, gap: 12, paddingBottom: 112 },

  heroCard: {
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(20,200,255,0.22)',
    overflow: 'hidden',
    padding: Spacing.lg,
    gap: 15,
    backgroundColor: '#FFFFFF',
    ...Shadow.float,
  },
  heroTopGlow: { position: 'absolute', left: 0, right: 0, top: 0, height: 4, backgroundColor: Brand.cyan },

  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  kickerPill: { alignSelf: 'flex-start', borderRadius: Radius.pill, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(20,200,255,0.24)' },
  kickerText: { color: Brand.cyanDeep, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  resetChip: { borderRadius: Radius.pill, backgroundColor: 'rgba(255,178,26,0.16)', paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,178,26,0.18)' },
  resetChipText: { color: Brand.orangeDeep, fontSize: 11, fontWeight: '900' },

  heroTitle: { color: Palette.text, fontSize: 26, lineHeight: 31, fontWeight: '900' },

  heroStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 0, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, borderWidth: 1, borderColor: 'rgba(23,18,32,0.08)', paddingVertical: 10, paddingHorizontal: 14 },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatValue: { fontSize: 17, lineHeight: 21, fontWeight: '900' },
  heroStatLabel: { color: Palette.textMuted, fontSize: 10, lineHeight: 13, fontWeight: '900', textTransform: 'uppercase', marginTop: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(23,18,32,0.08)' },

  progressBlock: { gap: 7 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: Palette.text, fontSize: 14, fontWeight: '900' },
  progressPercent: { color: Brand.purpleDeep, fontSize: 12, fontWeight: '900' },
  nextHint: { color: Palette.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 2 },

  chestPreview: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: Radius.xl, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(23,18,32,0.08)' },
  chestPreviewIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  chestPreviewLabel: { color: Palette.textMuted, fontSize: 10, lineHeight: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  chestPreviewTitle: { color: Palette.text, fontSize: 15, lineHeight: 19, fontWeight: '900' },
  chestRarityPill: { borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  chestRarityText: { fontSize: 11, lineHeight: 14, fontWeight: '900' },

  path: { gap: 10, position: 'relative', paddingBottom: Spacing.sm },
  pathLine: { position: 'absolute', left: 21, top: 12, bottom: 12, width: 3, backgroundColor: 'rgba(20,200,255,0.12)', borderRadius: 4 },

  reward: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: Radius.xl,
    padding: 14,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
    ...Shadow.soft,
  },
  rewardUnlocked: { backgroundColor: 'rgba(255,255,255,1)', borderColor: 'rgba(0,0,0,0.06)' },
  currentReward: { borderColor: 'rgba(255,140,0,0.30)', backgroundColor: 'rgba(255,178,26,0.05)' },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotText: { fontSize: 13, fontWeight: '900' },
  rewardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  xpLabel: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  rewardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8 },
  rewardIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rewardTitle: { color: Palette.text, fontSize: 16, lineHeight: 20, fontWeight: '900', flex: 1 },
  rewardDetail: { color: Palette.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 2 },
  rewardMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  rewardMetaPill: { overflow: 'hidden', borderRadius: Radius.pill, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, lineHeight: 12, fontWeight: '900', textTransform: 'uppercase' },
  rewardCodeText: { overflow: 'hidden', borderRadius: Radius.pill, backgroundColor: Palette.surfaceAlt, color: Palette.textMuted, paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, lineHeight: 12, fontWeight: '900' },
  statusPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: Radius.pill },
  status: { fontSize: 11, fontWeight: '900' },
});
