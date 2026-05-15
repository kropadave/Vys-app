import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { claimQrEventForParticipant, type QrClaimResult } from '@/hooks/use-qr-events';
import { useParticipantProfile } from '@/hooks/use-participant-profile';
import { CoachColors } from '@/lib/coach-theme';
import { Radius, Spacing } from '@/lib/theme';

export default function QrClaimScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ event?: string | string[] }>();
  const initialEventId = useMemo(() => {
    const value = params.event;
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
  }, [params.event]);
  const [eventId, setEventId] = useState(initialEventId);
  const [result, setResult] = useState<QrClaimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const autoClaimedEventId = useRef<string | null>(null);
  const { profile, loading: profileLoading, error: profileError } = useParticipantProfile();

  async function claim(code = eventId) {
    if (profileLoading) return;
    if (profileError) {
      setResult({ status: 'error', message: profileError });
      return;
    }

    const normalizedCode = code.trim();
    if (!normalizedCode) {
      setResult({ status: 'not-found' });
      return;
    }

    try {
      setLoading(true);
      const nextResult = await claimQrEventForParticipant(normalizedCode, {
        id: profile.id,
        name: profile.name,
      });
      setResult(nextResult);
    } catch (error) {
      setResult({ status: 'error', message: error instanceof Error ? error.message : 'QR se nepodařilo potvrdit.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialEventId) return;
    if (profileLoading) return;
    if (autoClaimedEventId.current === initialEventId) return;
    autoClaimedEventId.current = initialEventId;
    setEventId(initialEventId);
    void claim(initialEventId);
  }, [initialEventId, profileLoading]);

  const feedback = result ? qrClaimFeedback(result) : null;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.kicker}>TeamVYS QR</Text>
        <Text style={styles.title}>Potvrzení splněného triku</Text>
        <Text style={styles.body}>Účastník: {profileLoading ? 'Načítám profil...' : profile.name}</Text>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>Kód z QR</Text>
          <TextInput
            value={eventId}
            onChangeText={setEventId}
            placeholder="qr-trick-id"
            placeholderTextColor={CoachColors.slateMuted}
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        <Pressable disabled={loading || profileLoading} onPress={() => claim()} style={({ pressed }) => [styles.primaryButton, (loading || profileLoading) && styles.disabledButton, pressed && !loading && !profileLoading && { opacity: 0.86 }]}> 
          <Text style={styles.primaryButtonText}>{loading || profileLoading ? 'Ověřuji profil...' : 'Připsat trik a XP'}</Text>
        </Pressable>

        {profileError ? (
          <View style={[styles.feedback, styles.feedbackWarning]}>
            <Text style={styles.feedbackTitle}>Profil není připravený</Text>
            <Text style={styles.feedbackBody}>{profileError}</Text>
          </View>
        ) : null}

        {feedback ? (
          <View style={[styles.feedback, feedback.tone === 'success' && styles.feedbackSuccess, feedback.tone === 'warning' && styles.feedbackWarning]}>
            <Text style={styles.feedbackTitle}>{feedback.title}</Text>
            <Text style={styles.feedbackBody}>{feedback.body}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable onPress={() => router.replace('/home')} style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.82 }]}>
            <Text style={styles.secondaryButtonText}>Přejít na přehled</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/tricks')} style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.82 }]}>
            <Text style={styles.secondaryButtonText}>Skill tree</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function qrClaimFeedback(result: QrClaimResult) {
  if (result.status === 'claimed') {
    return {
      tone: 'success' as const,
      title: `+${result.xp} XP za ${result.trickTitle}`,
      body: 'XP se propsaly dítěti a trenérovi. Stejný záznam se počítá do QR triků trenéra.',
    };
  }

  if (result.status === 'already-claimed') {
    return {
      tone: 'warning' as const,
      title: 'Tenhle QR už je potvrzený',
      body: `${result.trickTitle} už má ${result.participantName} zapsaný, XP se nepřičítají dvakrát.`,
    };
  }

  if (result.status === 'expired') return { tone: 'warning' as const, title: 'QR kód vypršel', body: 'Trenér musí vygenerovat nový kód. Platnost je 60 sekund.' };
  if (result.status === 'missing-ward') return { tone: 'warning' as const, title: 'Účastník není ve svěřencích', body: `${result.participantName} není navázaný na seznam svěřenců trenéra.` };
  if (result.status === 'not-found') return { tone: 'warning' as const, title: 'QR kód neexistuje', body: 'Zkontroluj kód nebo nech trenéra vygenerovat nový QR.' };
  return { tone: 'warning' as const, title: 'QR se nepodařilo potvrdit', body: result.message };
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: CoachColors.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  card: { width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: CoachColors.panel, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md, borderWidth: 1, borderColor: CoachColors.border },
  kicker: { color: CoachColors.blue, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: CoachColors.slate, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  body: { color: CoachColors.slateMuted, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  inputBlock: { gap: Spacing.xs },
  label: { color: CoachColors.slate, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  input: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, color: CoachColors.slate, padding: Spacing.md, fontSize: 14, fontWeight: '700' },
  primaryButton: { backgroundColor: CoachColors.blue, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  feedback: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: 4 },
  feedbackSuccess: { backgroundColor: CoachColors.tealSoft, borderColor: CoachColors.teal },
  feedbackWarning: { backgroundColor: CoachColors.amberSoft, borderColor: CoachColors.amber },
  feedbackTitle: { color: CoachColors.slate, fontSize: 16, fontWeight: '900' },
  feedbackBody: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  secondaryButton: { flex: 1, minWidth: 150, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, alignItems: 'center' },
  secondaryButtonText: { color: CoachColors.slate, fontSize: 14, fontWeight: '900' },
});