import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { QrScanner } from '@/components/qr-scanner';
import { useParticipantProfile } from '@/hooks/use-participant-profile';
import { useParticipantRewards } from '@/hooks/use-participant-rewards';
import { claimQrEventForParticipant, claimWorkshopForParticipant, parseQrPayload, type QrClaimResult } from '@/hooks/use-qr-events';
import { crateDefinitions, rarityLabel, rollCrate, type LootResult } from '@/lib/attendance-coins';
import { Palette, Radius, Spacing } from '@/lib/theme';

export default function QrClaimScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    event?: string | string[];
    workshop?: string | string[];
    title?: string | string[];
    ts?: string | string[];
    coach?: string | string[];
  }>();
  const initialEventId = useMemo(() => {
    const value = params.event;
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
  }, [params.event]);
  const workshopId = useMemo(() => {
    const value = params.workshop;
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
  }, [params.workshop]);
  const workshopTitle = useMemo(() => {
    const value = params.title;
    const raw = Array.isArray(value) ? value[0] ?? '' : value ?? '';
    return decodeURIComponent(raw);
  }, [params.title]);
  const workshopTs = useMemo(() => {
    const value = params.ts;
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
  }, [params.ts]);
  const workshopCoach = useMemo(() => {
    const value = params.coach;
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
  }, [params.coach]);
  const [eventId, setEventId] = useState(initialEventId);
  const [result, setResult] = useState<QrClaimResult | null>(null);
  const [crateLoot, setCrateLoot] = useState<LootResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualName, setManualName] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const autoClaimedEventId = useRef<string | null>(null);
  const { profile, loading: profileLoading, error: profileError, hasLiveProfile, refresh, markTrickCompleted } = useParticipantProfile();
  const rewards = useParticipantRewards();

  const effectiveParticipant = hasLiveProfile
    ? { id: profile.id, name: profile.name, xp: profile.xp }
    : { id: 'guest', name: manualName.trim() };

  // On a rescan of an already-completed trick, give a common crate instead of XP.
  async function awardRescanCrate(): Promise<LootResult> {
    const crate = crateDefinitions.find((c) => c.id === 'common') ?? crateDefinitions[0];
    const loot = rollCrate(crate);
    await rewards.buyCrate({
      price: 0,
      coinsReward: loot.kind === 'coins' ? loot.amount : 0,
      mascot: loot.kind === 'mascot' ? loot.mascot : undefined,
    });
    return loot;
  }

  // Apply side effects of a claim result, then show the result screen.
  async function applyClaimResult(nextResult: QrClaimResult) {
    if (nextResult.status === 'claimed') {
      if (nextResult.trickId) markTrickCompleted(nextResult.trickId);
      void refresh();
    } else if (nextResult.status === 'rescan-crate') {
      if (nextResult.trickId) markTrickCompleted(nextResult.trickId);
      const loot = await awardRescanCrate();
      setCrateLoot(loot);
    }
    setResult(nextResult);
  }

  async function claim(code = eventId) {
    if (profileLoading) return;
    if (!hasLiveProfile && !manualName.trim()) {
      setResult({ status: 'error', message: 'Zadej své jméno, aby bylo jasné komu připsat XP.' });
      return;
    }

    if (workshopId) {
      try {
        setLoading(true);
        const nextResult = await claimWorkshopForParticipant(workshopId, workshopTitle, workshopTs, workshopCoach, effectiveParticipant);
        setResult(nextResult);
        if (nextResult.status === 'claimed') void refresh();
      } catch (error) {
        setResult({ status: 'error', message: error instanceof Error ? error.message : 'Workshop QR se nepodařilo potvrdit.' });
      } finally {
        setLoading(false);
      }
      return;
    }

    const normalizedCode = code.trim();
    if (!normalizedCode) {
      setResult({ status: 'not-found' });
      return;
    }

    try {
      setLoading(true);
      const nextResult = await claimQrEventForParticipant(normalizedCode, effectiveParticipant);
      await applyClaimResult(nextResult);
    } catch (error) {
      setResult({ status: 'error', message: error instanceof Error ? error.message : 'QR se nepodařilo potvrdit.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (workshopId) {
      if (profileLoading) return;
      void claim();
      return;
    }
    if (!initialEventId) return;
    if (profileLoading) return;
    if (autoClaimedEventId.current === initialEventId) return;
    autoClaimedEventId.current = initialEventId;
    setEventId(initialEventId);
    void claim(initialEventId);
  }, [initialEventId, workshopId, profileLoading]);

  const feedback = result ? qrClaimFeedback(result) : null;

  // Rescan of a completed trick — show a "Běžná bedna" reward screen.
  if (result && result.status === 'rescan-crate') {
    return (
      <View style={styles.resultPage}>
        <View style={styles.resultCard}>
          <View style={[styles.iconCircle, styles.iconCircleCrate]}>
            <Text style={styles.crateEmoji}>🎁</Text>
          </View>

          <View style={styles.crateBadge}>
            <Text style={styles.crateBadgeText}>Běžná bedna</Text>
          </View>

          <Text style={[styles.resultTitle, styles.resultTitleCrate]}>Trik už máš splněný!</Text>
          <Text style={styles.resultBody}>
            {crateLoot
              ? `Za opětovné načtení dostáváš běžnou bednu.\n${crateLootLabel(crateLoot)}`
              : 'Za opětovné načtení dostáváš běžnou bednu.'}
          </Text>

          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.82 }]}>
            <Text style={styles.doneBtnText}>OK</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // After claim — show result screen only
  if (result) {
    const isSuccess = feedback?.tone === 'success';
    return (
      <View style={styles.resultPage}>
        <View style={styles.resultCard}>
          {/* Icon circle */}
          <View style={[styles.iconCircle, isSuccess ? styles.iconCircleSuccess : styles.iconCircleWarn]}>
            <Text style={styles.iconText}>{isSuccess ? '✓' : '!'}</Text>
          </View>

          {/* XP badge — only on success */}
          {isSuccess && feedback && (
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>{feedback.xpLabel}</Text>
            </View>
          )}

          <Text style={[styles.resultTitle, isSuccess ? styles.resultTitleSuccess : styles.resultTitleWarn]}>
            {feedback?.title ?? ''}
          </Text>
          <Text style={styles.resultBody}>{feedback?.body ?? ''}</Text>

          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.82 }]}>
            <Text style={styles.doneBtnText}>OK</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Input / loading screen
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>TeamVYS QR</Text>
        <Text style={styles.title}>Potvrzení triku</Text>

        {profileLoading ? (
          <Text style={styles.body}>Načítám profil…</Text>
        ) : hasLiveProfile ? (
          <Text style={styles.body}>{profile.name}</Text>
        ) : (
          <View style={styles.inputBlock}>
            <Text style={styles.label}>Tvoje jméno (nejsi přihlášen)</Text>
            <TextInput
              value={manualName}
              onChangeText={setManualName}
              placeholder="Jméno a příjmení"
              placeholderTextColor={Palette.textSubtle}
              style={styles.input}
            />
          </View>
        )}

        <View style={styles.inputBlock}>
          <Text style={styles.label}>Nebo zadej kód ručně</Text>
          <TextInput
            value={eventId}
            onChangeText={setEventId}
            placeholder="qr-trick-id"
            placeholderTextColor={Palette.textSubtle}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <Modal visible={scannerOpen} animationType="slide" onRequestClose={() => setScannerOpen(false)}>
          <QrScanner
            onScanned={(raw) => {
              setScannerOpen(false);
              const payload = parseQrPayload(raw);
              if (payload.workshop) {
                router.replace({
                  pathname: '/qr-claim',
                  params: { workshop: payload.workshop, title: payload.title ?? '', ts: payload.ts ?? '', coach: payload.coach ?? '' },
                });
                return;
              }
              const code = (payload.event ?? '').trim();
              if (!code) { setResult({ status: 'not-found' }); return; }
              setEventId(code);
              void claim(code);
            }}
            onClose={() => setScannerOpen(false)}
          />
        </Modal>

        <Pressable
          disabled={loading || profileLoading}
          onPress={() => claim()}
          style={({ pressed }) => [styles.primaryButton, (loading || profileLoading) && styles.disabledButton, pressed && !loading && !profileLoading && { opacity: 0.86 }]}
        >
          <Text style={styles.primaryButtonText}>{loading || profileLoading ? 'Ověřuji…' : 'Připsat trik a XP'}</Text>
        </Pressable>

        {profileError && hasLiveProfile === false && (
          <View style={styles.warnBox}>
            <Text style={styles.warnTitle}>Nejsi přihlášen</Text>
            <Text style={styles.warnBody}>Zadej jméno výše nebo se přihlas jako účastník.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function crateLootLabel(loot: LootResult): string {
  if (loot.kind === 'mascot') return `Získal jsi maskota: ${rarityLabel[loot.mascot.rarity]} · ${loot.mascot.poseLabel}`;
  if (loot.kind === 'coins') return `+${loot.amount} klubek přidáno`;
  if (loot.kind === 'xp') return `+${loot.amount} XP bonus`;
  return loot.label;
}

function qrClaimFeedback(result: QrClaimResult): { tone: 'success' | 'warning'; title: string; body: string; xpLabel?: string } {
  if (result.status === 'claimed') {
    const partial =
      result.tricksCompleted !== undefined &&
      result.totalTricks !== undefined &&
      result.tricksCompleted < result.totalTricks;
    return {
      tone: 'success',
      title: result.trickTitle,
      body: partial
        ? `Poloviční odměna za ${result.tricksCompleted}/${result.totalTricks} splněných triků workshopu.`
        : 'XP připsány. Tak dál!',
      xpLabel: `+${result.xp} XP`,
    };
  }
  if (result.status === 'already-claimed') {
    return { tone: 'warning', title: 'Tenhle QR už je potvrzený', body: `${result.trickTitle} už má ${result.participantName} zapsaný.` };
  }
  if (result.status === 'not-unlocked') {
    return { tone: 'warning', title: 'Workshop není odemčený', body: `${result.participantName} nemá žádný ze dvou triků workshopu splněný.` };
  }
  if (result.status === 'arena-locked') {
    return { tone: 'warning', title: 'Aréna ještě není odemčená', body: `${result.trickTitle} patří do arény ${result.level}, kterou ${result.participantName} zatím nemá odemčenou.` };
  }
  if (result.status === 'expired') return { tone: 'warning', title: 'QR kód vypršel', body: 'Trenér musí vygenerovat nový kód. Platnost je 60 sekund.' };
  if (result.status === 'missing-ward') return { tone: 'warning', title: 'Účastník není ve svěřencích', body: `${result.participantName} není navázaný na seznam svěřenců trenéra.` };
  if (result.status === 'not-found') return { tone: 'warning', title: 'QR kód neexistuje', body: 'Zkontroluj kód nebo nech trenéra vygenerovat nový QR.' };
  return { tone: 'warning', title: 'QR se nepodařilo potvrdit', body: result.message };
}

const styles = StyleSheet.create({
  // Result screen
  resultPage: { flex: 1, backgroundColor: Palette.bg, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  resultCard: { width: '100%', maxWidth: 380, backgroundColor: Palette.surface, borderRadius: Radius.xl, padding: Spacing.xxl, alignItems: 'center', gap: Spacing.lg, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  iconCircleSuccess: { backgroundColor: Palette.successSoft },
  iconCircleWarn: { backgroundColor: Palette.accentSoft },
  iconCircleCrate: { backgroundColor: Palette.accentSoft },
  iconText: { fontSize: 38, fontWeight: '900', color: Palette.text },
  crateEmoji: { fontSize: 42 },
  crateBadge: { backgroundColor: Palette.accent, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs },
  crateBadgeText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  xpBadge: { backgroundColor: Palette.success, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs },
  xpBadgeText: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  resultTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  resultTitleSuccess: { color: Palette.success },
  resultTitleWarn: { color: Palette.text },
  resultTitleCrate: { color: Palette.text },
  resultBody: { color: Palette.textMuted, fontSize: 14, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  doneBtn: { marginTop: Spacing.md, width: '100%', backgroundColor: Palette.primary, borderRadius: Radius.pill, paddingVertical: 16, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  // Input screen
  page: { flex: 1, backgroundColor: Palette.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  card: { width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: Palette.surface, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  kicker: { color: Palette.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: Palette.text, fontSize: 26, lineHeight: 32, fontWeight: '900' },
  body: { color: Palette.textMuted, fontSize: 15, fontWeight: '700' },
  inputBlock: { gap: Spacing.xs },
  label: { color: Palette.text, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: Palette.surfaceAlt, borderColor: Palette.border, borderWidth: 1, borderRadius: Radius.md, color: Palette.text, padding: Spacing.md, fontSize: 14, fontWeight: '700' },
  primaryButton: { backgroundColor: Palette.primary, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: 16, alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  warnBox: { backgroundColor: Palette.accentSoft, borderRadius: Radius.md, padding: Spacing.md, gap: 4 },
  warnTitle: { color: Palette.text, fontSize: 14, fontWeight: '900' },
  warnBody: { color: Palette.textMuted, fontSize: 13, lineHeight: 18, fontWeight: '600' },
});

