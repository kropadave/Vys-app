import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AnimatedCounter, FadeInUp, PulseGlow, ScaleIn, StaggeredList } from '@/components/animated/motion';
import { useParticipantRewards } from '@/hooks/use-participant-rewards';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Crate images ────────────────────────────────────────────────────────────
const crateImageCommon  = require('@/assets/images/crate-common.png');
const crateImageRare    = require('@/assets/images/crate-rare.png');
const crateImageGold    = require('@/assets/images/crate-gold.png');
const yarnBallImage     = require('@/assets/images/yarn-ball.png');
const crateBgImage      = require('@/assets/images/crate-bg.png');

// ─── Mascot images ───────────────────────────────────────────────────────────
const obchodImage = require('@/assets/images/obchod.png');
const pozadiArenaImage = require('@/assets/images/pozadi_arena.png');

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

function YarnCoin({ size = 20 }: { size?: number; color?: string }) {
  return <Image source={yarnBallImage} style={{ width: size, height: size }} contentFit="contain" />;
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
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 50, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      Animated.parallel([
        Animated.timing(scaleAnim,      { toValue: 1,  duration: 70, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacityAnim,    { toValue: 0,  duration: 110, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(translateYAnim, { toValue: -10, duration: 110, useNativeDriver: Platform.OS !== 'web' }),
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

// ─── Crate card tile ─────────────────────────────────────────────────────────

function CrateCard({ crate, onPress }: { crate: CrateDefinition; onPress: () => void }) {
  const crateImage =
    crate.id === 'gold' ? crateImageGold : crate.id === 'rare' ? crateImageRare : crateImageCommon;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.crateCardTile, { opacity: pressed ? 0.85 : 1, borderColor: crate.borderColor }]}
    >
      <LinearGradient
        colors={crate.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image source={crateImage} style={styles.crateTileImage} contentFit="contain" />
      <View style={styles.crateTileInfo}>
        <Text style={styles.crateTileName}>{crate.name}</Text>
        <Text style={styles.crateTileSub}>{crate.subtitle}</Text>
        <View style={styles.crateTilePriceRow}>
          <YarnCoin size={14} color={crate.badgeColor} />
          <Text style={[styles.crateTilePrice, { color: crate.badgeColor }]}>{crate.price}</Text>
          <Text style={styles.crateTilePriceLbl}>klubek</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Crate detail modal ───────────────────────────────────────────────────────

function CrateDetailModal({
  crate,
  coins,
  onBuy,
  onClose,
}: {
  crate: CrateDefinition | null;
  coins: number;
  onBuy: () => void;
  onClose: () => void;
}) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [showInfo, setShowInfo] = useState(false);
  const insets = useSafeAreaInsets();

  // Reset the info overlay whenever the modal is opened/closed for a crate.
  useEffect(() => {
    if (!crate) setShowInfo(false);
  }, [crate]);

  useEffect(() => {
    if (!crate) return;
    floatAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim, crate]);

  // Keep last non-null crate so content doesn't jump during close animation
  const [displayCrate, setDisplayCrate] = useState<CrateDefinition | null>(null);
  useEffect(() => {
    if (crate) setDisplayCrate(crate);
  }, [crate]);

  const canAfford = displayCrate ? coins >= displayCrate.price : false;

  const crateImage = !displayCrate
    ? null
    : displayCrate.id === 'gold'
    ? crateImageGold
    : displayCrate.id === 'rare'
    ? crateImageRare
    : crateImageCommon;

  const dropOdds = useMemo(() => {
    if (!displayCrate) return [];
    const total = displayCrate.lootTable.reduce((s, i) => s + i.weight, 0);
    const byGroup = new Map<string, { weight: number; color: string; label: string; amount?: number }>();
    for (const item of displayCrate.lootTable) {
      const r = item.result;
      let key: string, color: string, label: string, amount: number | undefined;
      if (r.kind === 'mascot') {
        key = r.mascot.rarity;
        color = rarityColor[r.mascot.rarity];
        label = rarityLabel[r.mascot.rarity];
      } else if (r.kind === 'coins') {
        key = 'coins'; color = Brand.orange; label = 'Klubka'; amount = r.amount;
      } else if (r.kind === 'xp') {
        key = 'xp'; color = Brand.limeDeep; label = 'XP'; amount = r.amount;
      } else {
        key = 'discount'; color = Brand.cyan; label = 'Sleva';
      }
      const existing = byGroup.get(key);
      byGroup.set(key, { weight: (existing?.weight ?? 0) + item.weight, color, label, amount });
    }
    return Array.from(byGroup.entries())
      .map(([key, v]) => ({ key, ...v, pct: Math.round((v.weight / total) * 100) }))
      .filter((d) => d.pct > 0);
  }, [displayCrate]);

  const handleBuy = useCallback(() => {
    if (!canAfford) return;
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }),
    ]).start(() => onBuy());
  }, [canAfford, shakeAnim, onBuy]);

  return (
    <>
      <Modal visible={!!crate} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.crateDetailOverlay}>
          <Image source={crateBgImage} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,5,20,0.45)' }]} />

          {/* Close button */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.crateDetailClose, { top: insets.top + 8 }, { opacity: pressed ? 0.7 : 1 }]}
          >
            <FontAwesome5 name="times" size={20} color="rgba(255,255,255,0.85)" />
          </Pressable>

          {/* Info button */}
          {dropOdds.length > 0 && (
            <Pressable
              onPress={() => setShowInfo(true)}
              style={({ pressed }) => [styles.crateDetailInfoBtn, { top: insets.top + 8 }, { opacity: pressed ? 0.7 : 1 }]}
            >
              <FontAwesome5 name="info" size={14} color="rgba(255,255,255,0.85)" />
            </Pressable>
          )}

          {/* Main content */}
          <View style={styles.crateDetailContent}>
            {/* Crate image with shake */}
            <Animated.View
              style={{
                transform: [
                  { translateY: floatAnim },
                  {
                    rotate: shakeAnim.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: ['-14deg', '0deg', '14deg'],
                    }),
                  },
                ],
              }}
            >
              <Image source={crateImage} style={styles.crateDetailImage} contentFit="contain" />
            </Animated.View>

            <Pressable
              onPress={handleBuy}
              disabled={!canAfford}
              style={({ pressed }) => [
                styles.crateDetailBuyBtn,
                { opacity: pressed ? 0.82 : 1 },
              ]}
            >
              {canAfford ? (
                <>
                  <YarnCoin size={20} color="#FFD85C" />
                  <Text style={styles.crateDetailBuyBtnText}>{displayCrate?.price}</Text>
                  <YarnCoin size={20} color="#FFD85C" />
                </>
              ) : (
                <>
                  <FontAwesome5 name="lock" size={16} color="rgba(255,255,255,0.5)" />
                  <Text style={[styles.crateDetailBuyBtnText, { color: 'rgba(255,255,255,0.5)' }]}>
                    {displayCrate?.price}
                  </Text>
                  <Image source={yarnBallImage} style={{ width: 20, height: 20, opacity: 0.5 }} contentFit="contain" />
                </>
              )}
            </Pressable>
          </View>

          {/* Drop odds info overlay — rendered inside the same Modal so iOS shows it
              (stacking two separate Modals doesn't work reliably on iOS). */}
          {showInfo && (
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowInfo(false)}>
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.crateInfoOverlay}>
                <View style={styles.crateInfoCard}>
                  <Text style={styles.crateDetailDropTitle}>Šance na obsah</Text>
                  <View style={[styles.crateDetailDropRow, { marginTop: 8 }]}>
                    {dropOdds.map((d) => (
                      <View key={d.key} style={styles.crateDetailDropChip}>
                        <View style={[styles.crateDetailDropDot, { backgroundColor: d.color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.crateDetailDropLbl, { color: d.color }]}>{d.label}</Text>
                          {d.amount != null && (
                            <Text style={styles.crateDetailDropSub}>+{d.amount} klubek</Text>
                          )}
                        </View>
                        <Text style={styles.crateDetailDropPct}>{d.pct} %</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </Pressable>
          )}
        </View>
      </Modal>
    </>
  );
}

// ─── Loot modal ───────────────────────────────────────────────────────────────

function LootModal({ result, onClose }: { result: LootResult | null; onClose: () => void }) {
  // Hooks must be called unconditionally — early return is after them
  const burstAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!result) return;
    burstAnim.setValue(0);
    Animated.sequence([
      Animated.spring(burstAnim, { toValue: 1.18, useNativeDriver: Platform.OS !== 'web', friction: 4, tension: 280 }),
      Animated.spring(burstAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 6, tension: 200 }),
    ]).start();
  }, [burstAnim, result]);

  if (!result) return null;

  const isMascot = result.kind === 'mascot';
  const isCoins = result.kind === 'coins';
  const isXp = result.kind === 'xp';

  const title = isMascot
    ? 'Nový maskot!'
    : isCoins
    ? `+${result.amount} klubek!`
    : isXp
    ? `+${(result as { kind: 'xp'; amount: number }).amount} XP!`
    : `${(result as { kind: 'discount'; percent: number; label: string }).percent}% sleva!`;

  const sub = isMascot
    ? rarityLabel[result.mascot.rarity] + ' · ' + result.mascot.poseLabel
    : isCoins
    ? 'Přidáno do zásoby'
    : isXp
    ? 'Přidáno ke zkušenostem'
    : (result as { kind: 'discount'; percent: number; label: string }).label;

  const iconColor = isMascot ? result.mascot.colorHex : isCoins ? Brand.orange : isXp ? Brand.limeDeep : Brand.cyan;
  const rarity = isMascot ? result.mascot.rarity : null;

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
                  ) : isXp ? (
                    <MaterialCommunityIcons name="star-circle-outline" size={56} color={iconColor} />
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
  const rewards = useParticipantRewards();
  const [xp, setXp] = useState(0);
  const [lootResult, setLootResult] = useState<LootResult | null>(null);
  const [selectedCrate, setSelectedCrate] = useState<CrateDefinition | null>(null);

  const coins = rewards.coins;
  const ownedMascots = rewards.ownedMascots;

  // Synthesize a pending attendance row per credited-but-not-converted training.
  // Source of truth = participants.attendance_done (incremented by the NFC scan RPC).
  const entries = useMemo<AttendanceEntry[]>(
    () => Array.from({ length: rewards.pending }, (_, index) => ({
      id: `pending-${index}`,
      date: 'Načteno z docházky',
      label: 'Trénink',
      converted: false,
    })),
    [rewards.pending],
  );

  // Coins badge bounce anim
  const coinsBounce = useRef(new Animated.Value(1)).current;

  const bounceCoin = useCallback(() => {
    Animated.sequence([
      Animated.spring(coinsBounce, { toValue: 1.18, useNativeDriver: Platform.OS !== 'web', friction: 4, tension: 300 }),
      Animated.spring(coinsBounce, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 5, tension: 200 }),
    ]).start();
  }, [coinsBounce]);

  const handleConvertEntry = useCallback(() => {
    void rewards.convertOne();
    bounceCoin();
  }, [rewards, bounceCoin]);

  const handleConvertAll = useCallback(() => {
    void rewards.convertAll();
    bounceCoin();
  }, [rewards, bounceCoin]);

  const handleBuyCrate = useCallback(
    (crate: CrateDefinition) => {
      if (coins < crate.price) return;
      const result = rollCrate(crate);
      void rewards.buyCrate({
        price: crate.price,
        coinsReward: result.kind === 'coins' ? result.amount : 0,
        mascot: result.kind === 'mascot' ? result.mascot : undefined,
      });
      if (result.kind === 'coins') bounceCoin();
      if (result.kind === 'xp') setXp((x) => x + result.amount);
      setLootResult(result);
    },
    [coins, rewards, bounceCoin],
  );

  const handleEquip = useCallback((id: string) => {
    void rewards.equipMascot(id);
  }, [rewards]);

  const attended = rewards.convertedAttendance;
  const pending = entries; // all remaining entries are pending

  return (
    <View style={{ flex: 1 }}>
      <Image source={pozadiArenaImage} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} contentFit="cover" />
      <ScrollView
        style={[styles.page, { backgroundColor: 'transparent' }]}
        contentContainerStyle={[styles.container, isMobile && styles.containerMobile]}
      >
        {/* ── Obchod image ─────────────────────────── */}
        <Image source={obchodImage} style={{ width: '100%', height: 280, marginBottom: Spacing.md }} contentFit="contain" />

        {/* ── Hero: docházka + klubka ─────────────── */}
        <FadeInUp>
          <View style={styles.heroCard}>
            <View style={[styles.heroRow, isMobile && styles.heroRowMobile]}>
              <Animated.View style={[styles.coinsBadge, { transform: [{ scale: coinsBounce }] }]}>
                <YarnCoin size={80} color={Brand.orange} />
                <AnimatedCounter to={coins} duration={700} style={styles.coinsNumber} />
              </Animated.View>

              {pending.length > 0 && (
                <Pressable
                  onPress={handleConvertAll}
                  style={({ pressed }) => [styles.convertAllBtn, { opacity: pressed ? 0.82 : 1 }]}
                >
                  <FontAwesome5 name="coins" size={15} color="#fff" />
                  <Text style={styles.convertAllBtnText}>Přeměnit vše ({pending.length})</Text>
                </Pressable>
              )}
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
            <CrateCard key={crate.id} crate={crate} onPress={() => setSelectedCrate(crate)} />
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

      <CrateDetailModal
        crate={selectedCrate}
        coins={coins}
        onBuy={() => {
          if (selectedCrate) {
            const c = selectedCrate;
            setSelectedCrate(null);
            handleBuyCrate(c);
          }
        }}
        onClose={() => setSelectedCrate(null)}
      />
      <LootModal result={lootResult} onClose={() => setLootResult(null)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: Spacing.lg, gap: Spacing.lg, maxWidth: 720, width: '100%', alignSelf: 'center' },
  containerMobile: { padding: Spacing.md, gap: Spacing.md },

  // Hero
  heroCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  heroRow: { flexDirection: 'column', alignItems: 'center', gap: Spacing.md },
  heroRowMobile: { flexDirection: 'column', alignItems: 'center', gap: Spacing.md },
  heroLeft: { gap: 8, alignItems: 'center' },

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
    justifyContent: 'center',
    gap: 10,
  },
  coinsNumber: { fontSize: 56, fontWeight: '900', color: Brand.orange },

  convertAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.orange,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: Radius.xl,
  },
  convertAllBtnText: { fontSize: 16, fontWeight: '900', color: '#fff' },

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

  // Crates – tile list
  cratesList: { gap: Spacing.md },
  crateCardTile: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    ...Shadow.soft,
  },
  crateTileImage: { width: 110, height: 110, flexShrink: 0 },
  crateTileInfo: { flex: 1, gap: 4 },
  crateTileName: { fontSize: 17, fontWeight: '900', color: Brand.ink },
  crateTileSub: { fontSize: 12, fontWeight: '600', color: Brand.inkSoft },
  crateTilePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  crateTilePrice: { fontSize: 18, fontWeight: '900' },
  crateTilePriceLbl: { fontSize: 12, fontWeight: '700', color: Brand.inkSoft },

  // Crate detail modal
  crateDetailOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  crateDetailClose: {
    position: 'absolute',
    top: 52,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  crateDetailInfoBtn: {
    position: 'absolute',
    top: 52,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  crateDetailContent: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  crateInfoOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  crateInfoCard: {
    gap: 4,
    backgroundColor: 'rgba(20,10,40,0.88)',
    borderRadius: Radius.xxl,
    paddingHorizontal: 32,
    paddingVertical: 28,
    width: '100%',
  },
  crateDetailImage: { width: 300, height: 300 },
  crateDetailName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  crateDetailPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  crateDetailPriceNum: { fontSize: 32, fontWeight: '900', color: '#FFD85C' },
  crateDetailPriceLbl: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  crateDetailGlassCard: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  crateDetailGlassInner: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  crateDetailBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  crateDetailBuyBtnText: { fontSize: 17, fontWeight: '900', color: '#FFFFFF' },
  crateDetailDropBox: { marginTop: 8, alignItems: 'center', gap: 12 },
  crateDetailDropTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  crateDetailDropRow: { flexDirection: 'column', gap: 8, alignSelf: 'stretch' },
  crateDetailDropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  crateDetailDropDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  crateDetailDropLbl: { fontSize: 13, fontWeight: '800' },
  crateDetailDropPct: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
  crateDetailDropSub: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.55)', marginTop: 1 },

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
