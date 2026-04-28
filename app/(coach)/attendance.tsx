import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import {
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  HourglassIcon,
  LockIcon,
  TargetIcon,
} from '@/components/icons/Icon3D';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import {
  COACH_TODAY_SESSIONS,
  WARDS,
  formatTime,
  type AttendanceEntry,
  type CoachSession,
  type WardSummary,
} from '@/lib/data/coach';
import { Gradients, Palette, Radius, Shadow, Spacing } from '@/lib/theme';

export default function AttendanceScreen() {
  const { session: sessionParam } = useLocalSearchParams<{ session?: string }>();
  const initial = COACH_TODAY_SESSIONS.find((s) => s.id === sessionParam) ?? COACH_TODAY_SESSIONS[0];

  const [active, setActive] = useState<CoachSession | null>(initial);
  const [running, setRunning] = useState(initial?.status === 'live');
  const [scanMode, setScanMode] = useState<'nfc' | 'qr'>('nfc');
  const [entries, setEntries] = useState<AttendanceEntry[]>(
    WARDS.filter((w) => w.presentToday).map((w) => ({
      wardId: w.id, status: 'present', method: 'nfc',
      at: new Date().toISOString(),
    })),
  );
  const [offline, setOffline] = useState(false);

  const wards = useMemo(() => {
    if (!active) return [] as WardSummary[];
    return WARDS;
  }, [active]);

  function startSession() {
    setRunning(true);
  }
  function stopSession() {
    setRunning(false);
    Alert.alert('Session ukončena', 'Docházka byla uložena. Pokud jsi byl offline, sync proběhne po připojení.');
  }
  function togglePresent(w: WardSummary) {
    setEntries((prev) => {
      const found = prev.find((e) => e.wardId === w.id);
      if (found) return prev.filter((e) => e.wardId !== w.id);
      return [
        ...prev,
        { wardId: w.id, status: 'present', method: scanMode, at: new Date().toISOString() },
      ];
    });
  }

  const presentIds = new Set(entries.filter((e) => e.status === 'present').map((e) => e.wardId));
  const presentCount = presentIds.size;

  return (
    <ScrollView
      style={{ backgroundColor: Palette.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.h1}>Docházka</Text>

      {/* Výběr session */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {COACH_TODAY_SESSIONS.map((s) => {
          const isActive = active?.id === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => { setActive(s); setRunning(s.status === 'live'); }}
              style={[styles.sessionChip, isActive && styles.sessionChipActive]}
            >
              <Text style={[styles.sessionChipTime, isActive && { color: Palette.surface }]}>
                {formatTime(s.startsAt)}
              </Text>
              <Text style={[styles.sessionChipTitle, isActive && { color: Palette.surface }]} numberOfLines={1}>
                {s.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {active && (
        <Card gradient={Gradients.hero} pad={18} radius={Radius.xl}>
          <Text style={styles.heroTitle}>{active.title}</Text>
          <Text style={styles.heroSub}>
            {active.venue} · {formatTime(active.startsAt)} – {formatTime(active.endsAt)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <Pill label={`${presentCount}/${active.enrolledCount} přítomno`} variant="yellow" icon={<CheckIcon size={14} />} />
            {running && <LivePulsePill />}
            {offline && <Pill label="Offline – syncne se" variant="plain" icon={<LockIcon size={14} />} />}
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            {!running ? (
              <Pressable onPress={startSession} style={[styles.bigBtn, styles.btnPrimary]}>
                <TargetIcon size={20} />
                <Text style={styles.btnPrimaryText}>Spustit session</Text>
              </Pressable>
            ) : (
              <Pressable onPress={stopSession} style={[styles.bigBtn, styles.btnDanger]}>
                <CheckIcon size={20} />
                <Text style={styles.btnPrimaryText}>Ukončit</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setOffline((v) => !v)} style={[styles.bigBtn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>{offline ? 'Online' : 'Test offline'}</Text>
            </Pressable>
          </View>
        </Card>
      )}

      {/* Scan mód */}
      <View style={styles.modeRow}>
        <Pressable
          onPress={() => setScanMode('nfc')}
          style={[styles.modeChip, scanMode === 'nfc' && styles.modeChipActive]}
        >
          <BoltIcon size={18} />
          <Text style={[styles.modeText, scanMode === 'nfc' && styles.modeTextActive]}>NFC náramek</Text>
        </Pressable>
        <Pressable
          onPress={() => setScanMode('qr')}
          style={[styles.modeChip, scanMode === 'qr' && styles.modeChipActive]}
        >
          <TargetIcon size={18} />
          <Text style={[styles.modeText, scanMode === 'qr' && styles.modeTextActive]}>QR kód</Text>
        </Pressable>
      </View>

      <Card pad={20} radius={Radius.lg}>
        <View style={styles.scanBox}>
          {scanMode === 'nfc' ? (
            <NfcAnimation running={running} />
          ) : (
            <QrPlaceholder />
          )}
          <Text style={styles.scanText}>
            {running
              ? scanMode === 'nfc'
                ? 'Přilož náramek dítěte k telefonu…'
                : 'Naskenuj QR kód dítěte'
              : 'Spusť session pro zahájení skenování'}
          </Text>
        </View>
      </Card>

      {/* Live seznam */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Děti ({wards.length})</Text>
        <Text style={styles.sectionSub}>{presentCount} přítomno</Text>
      </View>

      <View style={{ gap: 8 }}>
        {wards.map((w) => {
          const present = presentIds.has(w.id);
          return (
            <Pressable key={w.id} onPress={() => togglePresent(w)}>
              <Card pad={12} radius={Radius.lg}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.avatar, present ? styles.avatarPresent : styles.avatarAbsent]}>
                    <Text style={styles.avatarText}>{w.firstName[0]}{w.lastName[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.wardName}>{w.firstName} {w.lastName}</Text>
                    <Text style={styles.wardSub}>{w.group} · {w.age} let</Text>
                  </View>
                  {present ? (
                    <View style={styles.presentBadge}>
                      <CheckIcon size={18} />
                    </View>
                  ) : (
                    <View style={styles.absentBadge}>
                      <HourglassIcon size={18} />
                    </View>
                  )}
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

function LivePulsePill() {
  const v = useSharedValue(1);
  useEffect(() => {
    v.value = withRepeat(withTiming(0.4, { duration: 700 }), -1, true);
  }, [v]);
  const s = useAnimatedStyle(() => ({ opacity: v.value }));
  return (
    <Animated.View style={[s]}>
      <Pill label="● LIVE" variant="primary" />
    </Animated.View>
  );
}

function NfcAnimation({ running }: { running: boolean }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = 0;
    if (running) v.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
  }, [running, v]);
  const wave1 = useAnimatedStyle(() => ({ opacity: 1 - v.value, transform: [{ scale: 0.6 + v.value * 0.6 }] }));
  const wave2 = useAnimatedStyle(() => ({ opacity: 0.7 - v.value * 0.7, transform: [{ scale: 0.4 + v.value * 0.5 }] }));
  return (
    <View style={styles.nfcWrap}>
      <Animated.View style={[styles.nfcRing, wave1]} />
      <Animated.View style={[styles.nfcRing, wave2]} />
      <View style={styles.nfcCore}>
        <BoltIcon size={36} />
      </View>
    </View>
  );
}

function QrPlaceholder() {
  return (
    <View style={styles.qrBox}>
      <View style={styles.qrCorner} />
      <View style={[styles.qrCorner, styles.qrCornerTR]} />
      <View style={[styles.qrCorner, styles.qrCornerBL]} />
      <View style={[styles.qrCorner, styles.qrCornerBR]} />
      <ArrowRightIcon size={28} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg, paddingTop: 60, gap: Spacing.lg },
  h1: { fontSize: 28, fontWeight: '800', color: Palette.text },

  sessionChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.lg,
    backgroundColor: Palette.surface, ...Shadow.soft, maxWidth: 220,
  },
  sessionChipActive: { backgroundColor: Palette.primary500 },
  sessionChipTime: { fontWeight: '800', color: Palette.primary700 },
  sessionChipTitle: { color: Palette.text, marginTop: 2, fontSize: 12, fontWeight: '600' },

  heroTitle: { color: Palette.surface, fontSize: 18, fontWeight: '800' },
  heroSub: { color: Palette.surface, opacity: 0.9, marginTop: 4 },

  bigBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: Radius.pill,
  },
  btnPrimary: { backgroundColor: Palette.accentYellow },
  btnPrimaryText: { color: Palette.textOnAccent, fontWeight: '800' },
  btnDanger: { backgroundColor: Palette.danger },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.18)' },
  btnGhostText: { color: Palette.surface, fontWeight: '700' },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: Radius.pill, backgroundColor: Palette.surface, ...Shadow.soft,
  },
  modeChipActive: { backgroundColor: Palette.primary500 },
  modeText: { fontWeight: '700', color: Palette.text },
  modeTextActive: { color: Palette.surface },

  scanBox: { alignItems: 'center', gap: 14, paddingVertical: 12 },
  scanText: { color: Palette.textMuted, textAlign: 'center', fontWeight: '600' },
  nfcWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  nfcRing: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: Palette.primary400,
  },
  nfcCore: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Palette.primary100, alignItems: 'center', justifyContent: 'center',
  },
  qrBox: {
    width: 160, height: 160, backgroundColor: Palette.primary50,
    borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center',
  },
  qrCorner: {
    position: 'absolute', width: 28, height: 28, borderColor: Palette.primary500,
    top: 8, left: 8, borderTopWidth: 4, borderLeftWidth: 4,
  },
  qrCornerTR: { top: 8, right: 8, left: undefined, borderTopWidth: 4, borderRightWidth: 4, borderLeftWidth: 0 },
  qrCornerBL: { bottom: 8, top: undefined, left: 8, borderBottomWidth: 4, borderLeftWidth: 4, borderTopWidth: 0 },
  qrCornerBR: { bottom: 8, right: 8, top: undefined, left: undefined, borderBottomWidth: 4, borderRightWidth: 4, borderTopWidth: 0, borderLeftWidth: 0 },

  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Palette.text },
  sectionSub: { color: Palette.textMuted },

  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarPresent: { backgroundColor: Palette.accentMint },
  avatarAbsent: { backgroundColor: Palette.surfaceAlt },
  avatarText: { fontWeight: '800', color: Palette.text },
  wardName: { fontWeight: '800', color: Palette.text },
  wardSub: { color: Palette.textMuted, marginTop: 2, fontSize: 12 },
  presentBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.accentMint, alignItems: 'center', justifyContent: 'center' },
  absentBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
});
