import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AnimatedCounter, FadeInUp, PulseGlow, ScaleIn, StaggeredList } from '@/components/animated/motion';
import {
    COINS_PER_SESSION,
    crateDefinitions,
    rarityColor,
    rarityLabel,
    rarityShortLabel,
    rollCrate,
    type AttendanceEntry,
    type CrateDefinition,
    type LootResult,
    type OwnedMascot,
} from '@/lib/attendance-coins';
import { Brand, BrandGradient } from '@/lib/brand';
import { Radius, Shadow, Spacing } from '@/lib/theme';
import { useBreakpoint } from '@/lib/use-breakpoint';

// ─── Mascot images ───────────────────────────────────────────────────────────
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

const mascotAssetById: Partial<Record<string, ReturnType<typeof require>>> = {
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

// ─── Yarn ball icon ──────────────────────────────────────────────────────────

function YarnCoin({ size = 20, color = Brand.orange }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {/* Shadow */}
      <Circle cx="20" cy="22" r="14" fill="rgba(0,0,0,0.10)" />
      {/* Main ball */}
      <Circle cx="20" cy="20" r="14" fill={color} />
      {/* Highlight sheen */}
      <Circle cx="14" cy="13" r="5" fill="rgba(255,255,255,0.18)" />
      {/* Wrap threads - horizontal arcs */}
      <Path d="M 6.5 20 Q 20 10 33.5 20" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M 6.5 20 Q 20 30 33.5 20" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" />
      {/* Wrap threads - vertical arc */}
      <Path d="M 20 6.5 Q 30 20 20 33.5" fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth="1.8" strokeLinecap="round" />
      {/* Diagonal wrap */}
      <Path d="M 9 11 Q 22 20 11 31" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.4" strokeLinecap="round" />
      {/* Tail thread */}
      <Path d="M 28 8 Q 34 4 36 8" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <Path d="M 34 4 L 38 2" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="28" cy="8" r="2.2" fill="rgba(255,255,255,0.7)" />
    </Svg>
  );
}

// ─── Mascot bubble ────────────────────────────────────────────────────────────

function MascotBubble({ mascot, size = 56 }: { mascot: OwnedMascot; size?: number }) {
  const rc = rarityColor[mascot.rarity];
  return (
    <View
      style={[
        styles.mascotBubble,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: mascot.colorHex + '33', borderColor: rc },
      ]}
    >
      <MaterialCommunityIcons name="cat" size={size * 0.52} color={mascot.colorHex} />
      {mascot.equippedOnProfile && (
        <View style={[styles.equippedBadge, { backgroundColor: rc }]}>
          <MaterialCommunityIcons name="check-bold" size={9} color="#fff" />
        </View>
      )}
    </View>
  );
}

// ─── Odds pill ────────────────────────────────────────────────────────────────

function OddsPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.oddsPill, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <Text style={[styles.oddsPillText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Attendance row (individual, tappable) ────────────────────────────────────

function AttendanceRow({
  entry,
  onConvert,
}: {
  entry: AttendanceEntry;
  onConvert: (id: string) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback(() => {
    // Quick squeeze then fade-out immediately — total ~180 ms
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 50, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(scaleAnim,      { toValue: 1,  duration: 70, useNativeDriver: true }),
        Animated.timing(opacityAnim,    { toValue: 0,  duration: 110, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: -10, duration: 110, useNativeDriver: true }),
      ]),
    ]).start(() => onConvert(entry.id));
  }, [entry.id, onConvert, scaleAnim, opacityAnim, translateYAnim]);

  return (
    <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: translateYAnim }] }}>
      <View style={styles.attendanceRow}>
        <View style={[styles.attendanceDot, styles.attendanceDotPending]} />
        <View style={styles.attendanceRowInfo}>
          <Text style={styles.attendanceRowLabel}>{entry.label}</Text>
          <Text style={styles.attendanceRowDate}>{entry.date}</Text>
        </View>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable onPress={handlePress} style={styles.convertRowBtn}>
            <YarnCoin size={13} color="#fff" />
            <Text style={styles.convertRowBtnText}>+{COINS_PER_SESSION}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ─── Crate card with shake animation ─────────────────────────────────────────

function CrateCard({ crate, coins, onBuy }: { crate: CrateDefinition; coins: number; onBuy: () => void }) {
  const canAfford = coins >= crate.price;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const iconName =
    crate.id === 'epic' ? 'treasure-chest' : crate.id === 'rare' ? 'package-variant' : 'package-variant-closed';

  const handlePress = useCallback(() => {
    if (!canAfford) return;

    // Shake + flash sequence, then trigger buy callback at the end
    shakeAnim.setValue(0);
    flashAnim.setValue(0);

    Animated.sequence([
      // Rapid shake
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0.5, duration: 50, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, easing: Easing.linear, useNativeDriver: true }),
      ]),
      // Flash
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start(() => {
      onBuy();
    });
  }, [canAfford, shakeAnim, flashAnim, onBuy]);

  const shakeStyle = {
    transform: [
      {
        rotate: shakeAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: ['-12deg', '0deg', '12deg'],
        }),
      },
    ],
  };

  return (
    <View style={[styles.crateCard, { borderColor: crate.borderColor }]}>
      <LinearGradient
        colors={crate.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: flashAnim, borderRadius: Radius.xl }]}
      />

      <Animated.View style={[styles.crateIconWrap, shakeStyle]}>
        <MaterialCommunityIcons name={iconName} size={36} color={crate.badgeColor} />
      </Animated.View>

      <View style={styles.crateInfo}>
        <Text style={styles.crateName}>{crate.name}</Text>
        <Text style={styles.crateSubtitle}>{crate.subtitle}</Text>
        <View style={styles.crateOddsRow}>
          <OddsPill label="Maskot" color={crate.badgeColor} />
          <OddsPill label="Klubka" color={Brand.orange} />
          <OddsPill label="5% sleva" color={Brand.cyan} />
        </View>
      </View>

      <Pressable
        onPress={handlePress}
        disabled={!canAfford}
        style={({ pressed }) => [
          styles.buyBtn,
          { backgroundColor: canAfford ? crate.badgeColor : 'rgba(255,255,255,0.72)', opacity: pressed ? 0.82 : 1 },
        ]}
      >
        <YarnCoin size={14} color={canAfford ? '#fff' : Brand.inkSoft} />
        <Text style={[styles.buyBtnText, !canAfford && { color: Brand.inkSoft }]}>{crate.price}</Text>
      </Pressable>
    </View>
  );
}

// ─── Loot modal ───────────────────────────────────────────────────────────────

function LootModal({ result, onClose }: { result: LootResult | null; onClose: () => void }) {
  if (!result) return null;

  const isMascot = result.kind === 'mascot';
  const isCoins = result.kind === 'coins';

  const title = isMascot
    ? 'Nový maskot!'
    : isCoins
    ? `+${result.amount} klubek!`
    : `${result.percent}% sleva!`;

  const sub = isMascot
    ? rarityLabel[result.mascot.rarity] + ' · ' + result.mascot.poseLabel
    : isCoins
    ? 'Přidáno do zásoby'
    : (result as { kind: 'discount'; percent: number; label: string }).label;

  const iconColor = isMascot ? result.mascot.colorHex : isCoins ? Brand.orange : Brand.cyan;
  const rarity = isMascot ? result.mascot.rarity : null;

  // Confetti-like burst: big scale animation on icon
  const burstAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(burstAnim, { toValue: 1.18, useNativeDriver: true, friction: 4, tension: 280 }),
      Animated.spring(burstAnim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 200 }),
    ]).start();
  }, [burstAnim]);

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ScaleIn>
          <View style={styles.lootCard}>
            <LinearGradient
              colors={
                rarity === 'legendary'
                  ? (['#2E2A38', '#4C2B86', '#2E2A38'] as [string, string, string])
                  : rarity === 'epic'
                  ? (['#4C1A9A', '#9B4FF0', '#4C1A9A'] as [string, string, string])
                  : (BrandGradient.sunrise as unknown as [string, string, string])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Animated icon burst */}
            <Animated.View style={{ transform: [{ scale: burstAnim }] }}>
              <PulseGlow scaleTo={1.08} duration={1000}>
                <View
                  style={[
                    styles.lootIconCircle,
                    { backgroundColor: iconColor + '30', borderColor: iconColor + '66' },
                  ]}
                >
                  {isMascot ? (
                    <Image
                      source={mascotAssetById[result.mascot.id] ?? mascotBeigeSit}
                      style={{ width: 80, height: 80 }}
                      contentFit="contain"
                    />
                  ) : isCoins ? (
                    <YarnCoin size={56} color={iconColor} />
                  ) : (
                    <MaterialCommunityIcons name="tag-heart-outline" size={56} color={iconColor} />
                  )}
                </View>
              </PulseGlow>
            </Animated.View>

            {rarity && (
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor[rarity] + '33', borderColor: rarityColor[rarity] + '66' }]}>
                <Text style={[styles.rarityBadgeText, { color: rarity === 'legendary' || rarity === 'epic' ? '#E8D5FF' : rarityColor[rarity] }]}>
                  {rarityShortLabel[rarity]}
                </Text>
              </View>
            )}

            <Text
              style={[
                styles.lootTitle,
                (rarity === 'legendary' || rarity === 'epic') && { color: '#FFFFFF' },
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.lootSub,
                (rarity === 'legendary' || rarity === 'epic') && { color: 'rgba(255,255,255,0.75)' },
              ]}
            >
              {sub}
            </Text>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.lootCloseBtn, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.lootCloseBtnText}>Skvělé!</Text>
            </Pressable>
          </View>
        </ScaleIn>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DochazkaScreen() {
  const { isMobile } = useBreakpoint();
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [convertedCount, setConvertedCount] = useState(0);
  const [coins, setCoins] = useState(0);
  const [ownedMascots, setOwnedMascots] = useState<OwnedMascot[]>([]);
  const [lootResult, setLootResult] = useState<LootResult | null>(null);

  // Coins badge bounce anim
  const coinsBounce = useRef(new Animated.Value(1)).current;

  const bounceCoin = useCallback(() => {
    Animated.sequence([
      Animated.spring(coinsBounce, { toValue: 1.18, useNativeDriver: true, friction: 4, tension: 300 }),
      Animated.spring(coinsBounce, { toValue: 1, useNativeDriver: true, friction: 5, tension: 200 }),
    ]).start();
  }, [coinsBounce]);

  const handleConvertEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setConvertedCount((c) => c + 1);
    setCoins((c) => c + COINS_PER_SESSION);
    bounceCoin();
  }, [bounceCoin]);

  const handleBuyCrate = useCallback(
    (crate: CrateDefinition) => {
      if (coins < crate.price) return;
      setCoins((c) => c - crate.price);
      const result = rollCrate(crate);
      if (result.kind === 'coins') {
        setCoins((c) => c + result.amount);
        bounceCoin();
      }
      if (result.kind === 'mascot') {
        setOwnedMascots((prev) => {
          const exists = prev.find((x) => x.id === result.mascot.id);
          return exists ? prev : [...prev, { ...result.mascot, equippedOnProfile: false }];
        });
      }
      setLootResult(result);
    },
    [coins, bounceCoin],
  );

  const handleEquip = useCallback((id: string) => {
    setOwnedMascots((prev) => prev.map((m) => ({ ...m, equippedOnProfile: m.id === id })));
  }, []);

  const attended = convertedCount;
  const pending = entries; // all remaining entries are pending

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      >
        {/* ── Hero: docházka + klubka ─────────────── */}
        <FadeInUp>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#EDE4FF', '#F7F3FF', '#D9F5F0'] as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.heroRow, isMobile && styles.heroRowMobile]}>
              <View style={styles.heroLeft}>
                <View style={styles.kickerPill}>
                  <Text style={styles.kickerText}>Docházka</Text>
                </View>
                {pending.length > 0 ? (
                  <View style={styles.attendanceCountRow}>
                    <Text style={styles.attendanceCount}>{pending.length}</Text>
                    <Text style={styles.attendanceOf}>ke konverzi</Text>
                  </View>
                ) : (
                  <Text style={[styles.attendanceOf, { fontSize: 14 }]}>Vše přeměněno ✓</Text>
                )}
              </View>

              <Animated.View style={[styles.coinsBadge, { transform: [{ scale: coinsBounce }] }]}>
                <YarnCoin size={32} color={Brand.orange} />
                <AnimatedCounter to={coins} duration={700} style={styles.coinsNumber} />
                <Text style={styles.coinsLabel}>klubek</Text>
              </Animated.View>
            </View>
          </View>
        </FadeInUp>

        {/* ── Individuální záznamy ───────────────── */}
        <FadeInUp delay={60}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(255,140,26,0.14)' }]}>
              <FontAwesome5 name="calendar-check" size={14} color={Brand.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Záznamy tréninků</Text>
              <Text style={styles.sectionSub}>
                Každý příchod = <Text style={styles.highlight}>{COINS_PER_SESSION} klubek</Text>. Přemeň kdykoliv.
              </Text>
            </View>
          </View>
        </FadeInUp>

        <StaggeredList step={40} initialDelay={80} style={styles.attendanceList}>
          {[...entries].reverse().map((entry) => (
            <AttendanceRow key={entry.id} entry={entry} onConvert={handleConvertEntry} />
          ))}
        </StaggeredList>

        {/* ── Obchod s bednami ──────────────────── */}
        <FadeInUp delay={160}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(139,29,255,0.12)' }]}>
              <FontAwesome5 name="box-open" size={14} color={Brand.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Obchod s bednami</Text>
              <Text style={styles.sectionSub}>Za klubka otevři bednu — kočka čeká uvnitř.</Text>
            </View>
          </View>
        </FadeInUp>

        <StaggeredList step={70} initialDelay={180} style={styles.cratesList}>
          {crateDefinitions.map((crate) => (
            <CrateCard key={crate.id} crate={crate} coins={coins} onBuy={() => handleBuyCrate(crate)} />
          ))}
        </StaggeredList>

        {/* ── Průvodce raritami ─────────────────── */}
        <FadeInUp delay={260}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(255,200,0,0.14)' }]}>
              <FontAwesome5 name="star" size={14} color="#C89A00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Rarity maskotů</Text>
            </View>
          </View>
        </FadeInUp>
        <FadeInUp delay={340}>
          <View style={styles.rarityGuide}>
            {(['common', 'uncommon', 'rare', 'epic', 'legendary'] as const).map((r) => (
              <View key={r} style={[styles.rarityRow, { backgroundColor: rarityColor[r] + '14', borderLeftColor: rarityColor[r] }]}>
                <View style={[styles.rarityDot, { backgroundColor: rarityColor[r] }]} />
                <Text style={[styles.rarityGuideLabel, { color: rarityColor[r] }]}>
                  {rarityLabel[r]}
                </Text>
                <Text style={styles.rarityGuideSub}>3 pózy</Text>
              </View>
            ))}
          </View>
        </FadeInUp>

        <View style={{ height: 100 }} />
      </ScrollView>

      <LootModal result={lootResult} onClose={() => setLootResult(null)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F3FF' },
  container: { padding: Spacing.lg, gap: Spacing.lg, maxWidth: 720, width: '100%', alignSelf: 'center' },
  containerMobile: { padding: Spacing.md, gap: Spacing.md },

  // Hero
  heroCard: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(139,29,255,0.14)',
    ...Shadow.soft,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, flexWrap: 'wrap' },
  heroRowMobile: { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.md },
  heroLeft: { flex: 1, gap: 8, minWidth: 140 },

  kickerPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139,29,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  kickerText: { color: Brand.purpleDeep, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

  attendanceCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  attendanceCount: { fontSize: 38, fontWeight: '900', color: Brand.ink, lineHeight: 44 },
  attendanceOf: { fontSize: 15, fontWeight: '700', color: Brand.inkSoft },
  pendingHint: { fontSize: 12, fontWeight: '700', color: Brand.orange },

  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,178,26,0.14)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,178,26,0.36)',
  },
  coinsNumber: { fontSize: 28, fontWeight: '900', color: Brand.orange },
  coinsLabel: { fontSize: 12, fontWeight: '800', color: Brand.orangeDeep },

  // Sections
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  sectionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sectionTitle: { fontSize: 21, fontWeight: '900', color: Brand.ink, marginBottom: 2 },
  sectionSub: { fontSize: 13, fontWeight: '600', color: Brand.inkSoft, marginBottom: 2 },
  highlight: { fontWeight: '900', color: Brand.orange },

  // Attendance rows
  attendanceList: { gap: 6 },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(23,18,32,0.08)',
  },
  attendanceRowConverted: { backgroundColor: '#F6FFED', borderColor: 'rgba(160,220,80,0.22)' },
  attendanceDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  attendanceDotDone: { backgroundColor: Brand.limeDeep },
  attendanceDotPending: { backgroundColor: Brand.orange },
  attendanceRowInfo: { flex: 1 },
  attendanceRowLabel: { fontSize: 14, fontWeight: '800', color: Brand.ink },
  attendanceRowDate: { fontSize: 11, fontWeight: '600', color: Brand.inkSoft },
  convertedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  convertedBadgeText: { fontSize: 13, fontWeight: '800', color: Brand.orange },
  convertRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Brand.limeDeep,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.lg,
  },
  convertRowBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },

  // Crates
  cratesList: { gap: Spacing.md },
  crateCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.soft,
  },
  crateIconWrap: {
    width: 66,
    height: 66,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  crateInfo: { flex: 1, gap: 4 },
  crateName: { fontSize: 15, fontWeight: '900', color: Brand.ink },
  crateSubtitle: { fontSize: 11, fontWeight: '600', color: Brand.inkSoft },
  crateOddsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', marginTop: 2 },
  oddsPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  oddsPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    minWidth: 65,
    justifyContent: 'center',
    flexShrink: 0,
  },
  buyBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },

  // Mascots
  mascotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  mascotItem: { alignItems: 'center', gap: 4, width: 80 },
  mascotBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  equippedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  mascotName: { fontSize: 11, fontWeight: '800', color: Brand.ink, textAlign: 'center' },
  mascotRarity: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },
  equippedLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Brand.purpleDeep,
    backgroundColor: Brand.purpleLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  emptyMascots: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: Spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(23,18,32,0.08)',
  },
  emptyMascotsText: { color: Brand.inkSoft, fontWeight: '700', fontSize: 14 },

  // Rarity guide
  rarityGuide: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(23,18,32,0.08)',
    overflow: 'hidden',
  },
  rarityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23,18,32,0.06)',
    borderLeftWidth: 4,
  },
  rarityDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  rarityGuideLabel: { flex: 1, fontWeight: '800', fontSize: 14 },
  rarityGuideSub: { fontSize: 12, fontWeight: '600', color: Brand.inkSoft },

  // Loot modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12,7,20,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  lootCard: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    minWidth: 280,
    maxWidth: 360,
    ...Shadow.hero,
  },
  lootIconCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  rarityBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  rarityBadgeText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  lootTitle: { fontSize: 24, fontWeight: '900', color: Brand.ink, textAlign: 'center' },
  lootSub: { fontSize: 13, fontWeight: '700', color: Brand.inkSoft, textAlign: 'center' },
  lootCloseBtn: {
    backgroundColor: Brand.purpleDeep,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    marginTop: 4,
  },
  lootCloseBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
