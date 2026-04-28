import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import {
  BoltIcon,
  CheckIcon,
  HourglassIcon,
  LockIcon,
  TargetIcon,
} from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { TRICKS } from '@/lib/data/mock';
import { WARDS, type WardSummary } from '@/lib/data/coach';
import { Gradients, Palette, Radius, Shadow, Spacing } from '@/lib/theme';

type Mode = 'single' | 'batch';

export default function UnlockScreen() {
  const [mode, setMode] = useState<Mode>('single');
  const [selectedWard, setSelectedWard] = useState<WardSummary | null>(WARDS[0] ?? null);
  const [selectedWardIds, setSelectedWardIds] = useState<Set<string>>(new Set());
  const [trickId, setTrickId] = useState<string>(TRICKS.find((t) => t.status === 'available')?.id ?? TRICKS[0].id);
  const [qrActive, setQrActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  // Countdown
  useEffect(() => {
    if (!qrActive) return;
    if (secondsLeft <= 0) { setQrActive(false); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [qrActive, secondsLeft]);

  function generateQr() {
    setSecondsLeft(60);
    setQrActive(true);
  }
  function confirm() {
    Alert.alert(
      'Potvrdit odemčení?',
      mode === 'single'
        ? `Trik bude odemčen pro ${selectedWard?.firstName ?? 'vybrané dítě'}.`
        : `Trik bude odemčen pro ${selectedWardIds.size} dětí.`,
      [
        { text: 'Zrušit', style: 'cancel' },
        { text: 'Ano, odemknout', onPress: () => {
          setQrActive(false);
          Alert.alert('Hotovo', 'Trik byl odemčen. Děti dostanou notifikaci a XP.');
        } },
      ],
    );
  }

  function toggleBatchWard(id: string) {
    setSelectedWardIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const trick = useMemo(() => TRICKS.find((t) => t.id === trickId)!, [trickId]);

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Odemknout trik</Text>

      {/* Mode switch */}
      <View style={styles.modeRow}>
        <Pressable onPress={() => setMode('single')} style={[styles.modeChip, mode === 'single' && styles.modeChipActive]}>
          <TargetIcon size={18} />
          <Text style={[styles.modeText, mode === 'single' && styles.modeTextActive]}>Jedno dítě (QR)</Text>
        </Pressable>
        <Pressable onPress={() => setMode('batch')} style={[styles.modeChip, mode === 'batch' && styles.modeChipActive]}>
          <CheckIcon size={18} />
          <Text style={[styles.modeText, mode === 'batch' && styles.modeTextActive]}>Workshop (batch)</Text>
        </Pressable>
      </View>

      {/* Trick picker */}
      <Text style={styles.label}>Vyber trik</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {TRICKS.filter((t) => t.status !== 'mastered').map((t) => {
          const isActive = trickId === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTrickId(t.id)}
              style={[styles.trickChip, isActive && styles.trickChipActive]}
            >
              <Text style={[styles.trickChipName, isActive && { color: Palette.surface }]} numberOfLines={1}>
                {t.name}
              </Text>
              <Text style={[styles.trickChipXp, isActive && { color: Palette.surface, opacity: 0.9 }]}>
                +{t.xp} XP
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Card pad={14} radius={Radius.lg}>
        <Text style={styles.trickName}>{trick.name}</Text>
        <Text style={styles.trickDesc}>{trick.description}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
          <Pill label={`+${trick.xp} XP`} variant="yellow" icon={<BoltIcon size={14} />} />
          <Pill label={`Náramek ≥ ${trick.requiredBraceletLevel}`} variant="soft" icon={<LockIcon size={14} />} />
        </View>
      </Card>

      {mode === 'single' ? (
        <>
          <Text style={styles.label}>Vyber dítě</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {WARDS.map((w) => {
              const isActive = selectedWard?.id === w.id;
              return (
                <Pressable
                  key={w.id}
                  onPress={() => setSelectedWard(w)}
                  style={[styles.wardChip, isActive && styles.wardChipActive]}
                >
                  <View style={[styles.wardAvatar, isActive && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                    <Text style={[styles.wardAvatarText, isActive && { color: Palette.surface }]}>
                      {w.firstName[0]}
                    </Text>
                  </View>
                  <Text style={[styles.wardChipName, isActive && { color: Palette.surface }]} numberOfLines={1}>
                    {w.firstName}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* QR card */}
          <Card gradient={Gradients.hero} pad={20} radius={Radius.xl}>
            <Text style={styles.heroTitle}>Dynamický QR kód</Text>
            <Text style={styles.heroSub}>
              Dítě naskenuje · platnost 60 s · trenér potvrdí
            </Text>

            <View style={styles.qrCenter}>
              {qrActive ? (
                <PulsingQr seconds={secondsLeft} />
              ) : (
                <View style={styles.qrInactive}>
                  <LockIcon size={48} />
                </View>
              )}
            </View>

            {qrActive ? (
              <>
                <Text style={styles.timerText}>Platí ještě {secondsLeft} s</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable onPress={confirm} style={[styles.bigBtn, styles.btnYellow]}>
                    <CheckIcon size={20} />
                    <Text style={styles.btnYellowText}>Potvrdit (Ano)</Text>
                  </Pressable>
                  <Pressable onPress={() => setQrActive(false)} style={[styles.bigBtn, styles.btnGhost]}>
                    <Text style={styles.btnGhostText}>Zrušit</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable onPress={generateQr} style={[styles.bigBtn, styles.btnYellow, { alignSelf: 'flex-start' }]}>
                <BoltIcon size={20} />
                <Text style={styles.btnYellowText}>Vygenerovat QR (60 s)</Text>
              </Pressable>
            )}
          </Card>
        </>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Děti na workshopu ({selectedWardIds.size})</Text>
            <Pressable
              onPress={() => setSelectedWardIds(new Set(WARDS.map((w) => w.id)))}
            >
              <Text style={styles.linkText}>Vybrat všechny</Text>
            </Pressable>
          </View>

          <View style={{ gap: 8 }}>
            {WARDS.map((w) => {
              const checked = selectedWardIds.has(w.id);
              return (
                <Pressable key={w.id} onPress={() => toggleBatchWard(w.id)}>
                  <Card pad={12} radius={Radius.lg}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <CheckIcon size={16} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wardName}>{w.firstName} {w.lastName}</Text>
                        <Text style={styles.wardSub}>Náramek {w.braceletLevel} · {w.xp} XP</Text>
                      </View>
                      <HourglassIcon size={18} />
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={confirm}
            disabled={selectedWardIds.size === 0}
            style={[styles.bigBtn, styles.btnYellow, selectedWardIds.size === 0 && { opacity: 0.4 }]}
          >
            <CheckIcon size={20} />
            <Text style={styles.btnYellowText}>
              Odemknout pro {selectedWardIds.size} dětí
            </Text>
          </Pressable>
        </>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function PulsingQr({ seconds }: { seconds: number }) {
  const v = useSharedValue(1);
  useEffect(() => {
    v.value = withRepeat(withTiming(1.06, { duration: 800 }), -1, true);
  }, [v]);
  const s = useAnimatedStyle(() => ({ transform: [{ scale: v.value }] }));
  // generujeme šachovnicový pattern jako reprezentaci QR
  const grid = Array.from({ length: 9 }, (_, i) => i);
  const ratio = seconds / 60;
  return (
    <Animated.View style={[styles.qrBig, s]}>
      <View style={styles.qrGrid}>
        {grid.map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 3 }}>
            {grid.map((col) => {
              const dark = (row * 31 + col * 17 + seconds) % 3 !== 0;
              return <View key={col} style={[styles.qrCell, dark && styles.qrCellDark]} />;
            })}
          </View>
        ))}
      </View>
      <View style={[styles.qrProgress, { width: `${ratio * 100}%` }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.lg },
  h1: { fontSize: 28, fontWeight: '800', color: Palette.text },
  label: { fontWeight: '800', color: Palette.text, marginTop: 4 },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: Radius.pill, backgroundColor: Palette.surface, ...Shadow.soft,
  },
  modeChipActive: { backgroundColor: Palette.primary500 },
  modeText: { fontWeight: '700', color: Palette.text },
  modeTextActive: { color: Palette.surface },

  trickChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.lg,
    backgroundColor: Palette.surface, ...Shadow.soft, maxWidth: 200,
  },
  trickChipActive: { backgroundColor: Palette.primary500 },
  trickChipName: { fontWeight: '800', color: Palette.text },
  trickChipXp: { color: Palette.primary700, fontSize: 12, marginTop: 2, fontWeight: '700' },

  trickName: { fontSize: 18, fontWeight: '800', color: Palette.text },
  trickDesc: { color: Palette.textMuted, marginTop: 4 },

  wardChip: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: Radius.lg,
    backgroundColor: Palette.surface, alignItems: 'center', gap: 6, minWidth: 80, ...Shadow.soft,
  },
  wardChipActive: { backgroundColor: Palette.primary500 },
  wardAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  wardAvatarText: { fontWeight: '800', color: Palette.text },
  wardChipName: { fontWeight: '700', color: Palette.text, fontSize: 12 },

  heroTitle: { color: Palette.surface, fontSize: 18, fontWeight: '800' },
  heroSub: { color: Palette.surface, opacity: 0.9, marginTop: 4 },

  qrCenter: { alignItems: 'center', marginVertical: 16 },
  qrInactive: {
    width: 180, height: 180, borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderStyle: 'dashed',
  },
  qrBig: {
    width: 200, height: 200, padding: 12, borderRadius: Radius.lg,
    backgroundColor: Palette.surface, alignItems: 'center', justifyContent: 'center',
  },
  qrGrid: { gap: 3 },
  qrCell: { width: 16, height: 16, backgroundColor: Palette.surfaceAlt, borderRadius: 2 },
  qrCellDark: { backgroundColor: Palette.text },
  qrProgress: {
    position: 'absolute', bottom: 0, left: 0, height: 4,
    backgroundColor: Palette.accentYellow, borderBottomLeftRadius: Radius.lg, borderBottomRightRadius: Radius.lg,
  },
  timerText: { color: Palette.surface, textAlign: 'center', marginBottom: 12, fontWeight: '700' },

  bigBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: Radius.pill, flex: 1,
  },
  btnYellow: { backgroundColor: Palette.accentYellow },
  btnYellowText: { color: Palette.textOnAccent, fontWeight: '800' },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.18)' },
  btnGhostText: { color: Palette.surface, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Palette.text },
  linkText: { color: Palette.primary600, fontWeight: '700' },

  checkbox: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Palette.surfaceAlt, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Palette.surfaceAlt,
  },
  checkboxChecked: { backgroundColor: Palette.accentYellow, borderColor: Palette.accentYellow600 },
  wardName: { fontWeight: '800', color: Palette.text },
  wardSub: { color: Palette.textMuted, marginTop: 2, fontSize: 12 },
});
