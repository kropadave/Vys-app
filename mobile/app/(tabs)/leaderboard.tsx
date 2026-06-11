import { FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeInUp, PulseGlow, ScaleIn } from '@/components/animated/motion';
import { useAuth } from '@/hooks/use-auth';
import { useParticipantCoinsLeaderboard, useParticipantLeaderboard, type ParticipantLeaderboardEntry } from '@/hooks/use-leaderboard';
import { useParticipantProfile } from '@/hooks/use-participant-profile';
import { ALL_MASCOTS } from '@/lib/attendance-coins';
import { Brand } from '@/lib/brand';
import { Palette, Radius, Shadow, Spacing } from '@/lib/theme';
import { useBreakpoint } from '@/lib/use-breakpoint';

type LeagueMode = 'xp' | 'coins';

const PODIUM_COLORS = [Brand.orange, Brand.cyan, Brand.pink];

// ─── Mascot images ─────────────────────────────────────────────────────────────
const mascotBeigeSit    = require('@/assets/images/maskoti/maskot-beige-sit.png');
const mascotBeigeSleep  = require('@/assets/images/maskoti/maskot-beige-sleep.png');
const mascotBeigeWave   = require('@/assets/images/maskoti/maskot-beige-wave.png');
const mascotPinkSit     = require('@/assets/images/maskoti/maskot-pink-sit.png');
const mascotPinkJump    = require('@/assets/images/maskoti/maskot-pink-jump.png');
const mascotPinkWave    = require('@/assets/images/maskoti/maskot-pink-wave.png');
const mascotPurpleSit   = require('@/assets/images/maskoti/maskot-purple-sit.png');
const mascotPurpleRun   = require('@/assets/images/maskoti/maskot-purple-run.png');
const mascotPurpleCool  = require('@/assets/images/maskoti/maskot-purple-cool.png');
const mascotDarkpSit    = require('@/assets/images/maskoti/maskot-darkp-sit.png');
const mascotDarkpFly    = require('@/assets/images/maskoti/maskot-darkp-fly.png');
const mascotDarkpMagic  = require('@/assets/images/maskoti/maskot-darkp-magic.png');
const mascotBlackSit    = require('@/assets/images/maskoti/maskot-black-sit.png');
const mascotBlackShadow = require('@/assets/images/maskoti/maskot-black-shadow.png');
const mascotBlackMagic  = require('@/assets/images/maskoti/maskot-black-magic.png');

const mascotAssetById: Partial<Record<string, typeof mascotBeigeSit>> = {
  'beige-sit':    mascotBeigeSit,
  'beige-sleep':  mascotBeigeSleep,
  'beige-wave':   mascotBeigeWave,
  'pink-sit':     mascotPinkSit,
  'pink-jump':    mascotPinkJump,
  'pink-wave':    mascotPinkWave,
  'purple-sit':   mascotPurpleSit,
  'purple-run':   mascotPurpleRun,
  'purple-cool':  mascotPurpleCool,
  'darkp-sit':    mascotDarkpSit,
  'darkp-fly':    mascotDarkpFly,
  'darkp-magic':  mascotDarkpMagic,
  'black-sit':    mascotBlackSit,
  'black-shadow': mascotBlackShadow,
  'black-magic':  mascotBlackMagic,
};

function mascotForLeaderboardItem(item: ParticipantLeaderboardEntry) {
  return ALL_MASCOTS.find((mascot) => mascot.id === item.mascotId) ?? ALL_MASCOTS[0];
}

function mascotImageSource(item: ParticipantLeaderboardEntry) {
  return mascotAssetById[item.mascotId] ?? mascotBeigeSit;
}

export default function LeaderboardScreen() {
  const { isMobile } = useBreakpoint();
  const { session } = useAuth();
  const { profile } = useParticipantProfile();
  const [mode, setMode] = useState<LeagueMode>('xp');
  const { entries: xpLeaderboard, loading: xpLoading } = useParticipantLeaderboard(session?.userId);
  const { entries: coinsLeaderboard, loading: coinsLoading } = useParticipantCoinsLeaderboard(session?.userId);

  const liveLeaderboard = mode === 'coins' ? coinsLeaderboard : xpLeaderboard;
  const loading = mode === 'coins' ? coinsLoading : xpLoading;
  const podium = liveLeaderboard.slice(0, 3);
  const rest = liveLeaderboard.slice(3);
  const me = liveLeaderboard.find((item) => item.isMe) ?? liveLeaderboard.find((item) => item.name === profile.name);
  const myValue = mode === 'coins' ? (me?.coins ?? 0) : (me?.xp ?? profile.xp);

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}>
        <LeaderboardHero rank={me?.rank ?? 0} value={myValue} mode={mode} onChangeMode={setMode} />

      {loading ? (
        <ActivityIndicator color={Brand.purple} style={{ marginVertical: Spacing.xl }} />
      ) : (
        <>
          <View style={styles.podiumGrid}>
            {podium.map((item, index) => (
              <ScaleIn key={item.rank} delay={index * 90} style={styles.podiumWrap}>
                <PodiumCard item={item} myName={profile.name} mode={mode} />
              </ScaleIn>
            ))}
          </View>

          <View style={styles.list}>
            {rest.map((item, index) => (
              <FadeInUp key={item.rank} delay={index * 70}>
                <LeaderboardRow item={item} mode={mode} />
              </FadeInUp>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function valueFor(item: ParticipantLeaderboardEntry, mode: LeagueMode): number {
  return mode === 'coins' ? (item.coins ?? 0) : item.xp;
}

function LeaderboardHero({ rank, value, mode, onChangeMode }: { rank: number; value: number; mode: LeagueMode; onChangeMode: (mode: LeagueMode) => void }) {
  const isCoins = mode === 'coins';
  return (
    <View style={styles.heroCard}>
      <LinearGradient
        colors={isCoins ? ['#171220', '#3A1138', '#B7106F'] : ['#171220', '#2B1247', '#5410B7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[styles.heroRail, isCoins && { backgroundColor: Brand.pink }]} />
      <View style={styles.heroCopy}>
        <View style={styles.heroKicker}>
          <FontAwesome5 name={isCoins ? 'circle-notch' : 'trophy'} size={12} color={isCoins ? Brand.cyan : Brand.orange} />
          <Text style={styles.heroKickerText}>{isCoins ? 'Klubíčka liga' : 'XP liga'}</Text>
        </View>
        <Text style={styles.heroTitle}>{isCoins ? 'Sbírej klubíčka' : 'Drž top 3'}</Text>
        <View style={styles.heroChips}>
          <HeroChip icon="medal" value={`#${rank}`} />
          <HeroChip icon={isCoins ? 'circle-notch' : 'bolt'} value={isCoins ? `${value} klubíček` : `${value} XP`} />
        </View>

        <View style={styles.leagueToggle}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'xp' }}
            onPress={() => onChangeMode('xp')}
            style={[styles.leagueToggleBtn, mode === 'xp' && styles.leagueToggleBtnActive]}>
            <Text style={[styles.leagueToggleText, mode === 'xp' && styles.leagueToggleTextActive]}>XP · triky</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: mode === 'coins' }}
            onPress={() => onChangeMode('coins')}
            style={[styles.leagueToggleBtn, mode === 'coins' && styles.leagueToggleBtnActive]}>
            <Text style={[styles.leagueToggleText, mode === 'coins' && styles.leagueToggleTextActive]}>Klubíčka · docházka</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function HeroChip({ icon, value }: { icon: ComponentProps<typeof FontAwesome5>['name']; value: string }) {
  return (
    <View style={styles.heroChip}>
      <FontAwesome5 name={icon} size={11} color={Brand.cyan} />
      <Text style={styles.heroChipText}>{value}</Text>
    </View>
  );
}

function PodiumCard({ item, myName, mode }: { item: ParticipantLeaderboardEntry; myName: string; mode: LeagueMode }) {
  const isMe = item.isMe || item.name === myName;
  const mascot = mascotForLeaderboardItem(item);
  const color = mascot.colorHex || PODIUM_COLORS[item.rank - 1] || Brand.purple;
  const card = (
    <View style={[styles.podiumCard, item.rank === 1 && styles.podiumCardWinner, isMe && styles.podiumCardMe, { borderColor: color }]}> 
      <View style={[styles.podiumGlow, { backgroundColor: color }]} />
      <MascotAvatar item={item} color={color} size="large" />
      <Text style={[styles.podiumRank, { color }]}>#{item.rank}</Text>
      <Text style={styles.podiumName} numberOfLines={1}>{shortName(item.name, myName)}</Text>
      <Text style={[styles.podiumXp, { color }]}>{valueFor(item, mode)}</Text>
      <Text style={styles.podiumXpLabel}>{mode === 'coins' ? 'Klubíček' : 'XP'}</Text>
      {isMe ? <Text style={styles.meBadge}>Ty</Text> : null}
    </View>
  );

  return isMe ? <PulseGlow scaleTo={1.025}>{card}</PulseGlow> : card;
}

function LeaderboardRow({ item, mode }: { item: ParticipantLeaderboardEntry; mode: LeagueMode }) {
  const mascot = mascotForLeaderboardItem(item);
  const color = mascot.colorHex;
  return (
    <View style={[styles.row, { borderColor: hexToSoft(color, 0.24) }]}>
      <MascotAvatar item={item} color={color} size="small" />
      <Text style={styles.name}>{item.name}</Text>
      <View style={styles.xpWrap}>
        <Text style={styles.xp}>{valueFor(item, mode)}</Text>
        <Text style={styles.xpLabel}>{mode === 'coins' ? 'Klubíček' : 'XP'}</Text>
      </View>
    </View>
  );
}

function MascotAvatar({ item, color, size }: { item: ParticipantLeaderboardEntry; color: string; size: 'large' | 'small' }) {
  const isLarge = size === 'large';
  return (
    <View style={[isLarge ? styles.mascotOrbLarge : styles.mascotOrbSmall, { backgroundColor: hexToSoft(color, isLarge ? 0.17 : 0.12), borderColor: color }]}> 
      <Image source={mascotImageSource(item)} style={isLarge ? styles.mascotImageLarge : styles.mascotImageSmall} contentFit="contain" />
      <View style={[isLarge ? styles.mascotRankBadgeLarge : styles.mascotRankBadgeSmall, { backgroundColor: color }]}> 
        <Text style={styles.mascotRankBadgeText}>#{item.rank}</Text>
      </View>
    </View>
  );
}

function shortName(name: string, currentName: string) {
  return name === currentName ? currentName.split(' ')[0] : name;
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
    minHeight: 198,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    position: 'relative',
    ...Shadow.float,
  },
  heroRail: { position: 'absolute', left: 0, right: 0, top: 0, height: 5, backgroundColor: Brand.orange },
  heroCopy: { maxWidth: 420, gap: Spacing.md, position: 'relative', zIndex: 2 },
  heroKicker: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 8 },
  heroKickerText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.9 },
  heroTitle: { color: '#FFFFFF', fontSize: 38, lineHeight: 44, fontWeight: '900' },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8 },
  heroChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  leagueToggle: { flexDirection: 'row', gap: 6, marginTop: Spacing.sm, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.10)', padding: 4, alignSelf: 'flex-start' },
  leagueToggleBtn: { borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  leagueToggleBtnActive: { backgroundColor: '#FFFFFF' },
  leagueToggleText: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '900' },
  leagueToggleTextActive: { color: Palette.text },
  podiumGrid: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-end' },
  podiumWrap: { flex: 1, minWidth: 0 },
  podiumCard: {
    minHeight: 166,
    borderRadius: Radius.xl,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...Shadow.soft,
  },
  podiumCardWinner: { minHeight: 186, paddingTop: Spacing.lg },
  podiumCardMe: { backgroundColor: 'rgba(241,43,179,0.06)' },
  podiumGlow: { position: 'absolute', width: 120, height: 120, borderRadius: 60, opacity: 0.10, top: -28, right: -42 },
  mascotOrbLarge: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 8, overflow: 'visible', ...Shadow.glowOrange },
  mascotImageLarge: { width: 74, height: 86, marginTop: -8 },
  mascotRankBadgeLarge: { position: 'absolute', right: -6, bottom: 0, minWidth: 30, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7, borderWidth: 2, borderColor: '#FFFFFF' },
  mascotOrbSmall: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  mascotImageSmall: { width: 50, height: 58, marginTop: -4 },
  mascotRankBadgeSmall: { position: 'absolute', right: -6, bottom: -2, minWidth: 24, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: '#FFFFFF' },
  mascotRankBadgeText: { color: '#FFFFFF', fontSize: 10, lineHeight: 12, fontWeight: '900' },
  podiumRank: { fontSize: 12, lineHeight: 15, fontWeight: '900' },
  podiumName: { color: Palette.text, fontSize: 16, lineHeight: 20, fontWeight: '900', marginTop: 3, textAlign: 'center' },
  podiumXp: { fontSize: 24, lineHeight: 28, fontWeight: '900', marginTop: 8 },
  podiumXpLabel: { color: Palette.textMuted, fontSize: 10, lineHeight: 12, fontWeight: '900', textTransform: 'uppercase' },
  meBadge: { marginTop: 7, overflow: 'hidden', borderRadius: Radius.pill, backgroundColor: Brand.purple, color: '#FFFFFF', paddingHorizontal: 9, paddingVertical: 4, fontSize: 10, lineHeight: 12, fontWeight: '900', textTransform: 'uppercase' },
  list: { gap: Spacing.md },
  row: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    overflow: 'hidden',
    position: 'relative',
    ...Shadow.soft,
  },
  name: { color: Palette.text, fontSize: 17, fontWeight: '900', flex: 1, minWidth: 0 },
  xpWrap: { alignItems: 'flex-end' },
  xp: { color: Palette.text, fontSize: 22, fontWeight: '900', lineHeight: 24 },
  xpLabel: { color: Palette.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
});
