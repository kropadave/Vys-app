import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { BlurView } from 'expo-blur';
import QRCode from 'react-native-qrcode-svg';

import { CoachCard, CoachPageHeader } from '@/components/coach/coach-screen';
import { StatusPill } from '@/components/parent-card';
import { addQrEvent, type StoredQrEvent } from '@/hooks/use-qr-events';
import type { CoachTrick } from '@/lib/coach-content';
import { coachTricks } from '@/lib/coach-content';
import { CoachColors } from '@/lib/coach-theme';
import { Radius, Spacing } from '@/lib/theme';

const QR_CLAIM_BASE_URL = 'https://vys-expo-web-export.vercel.app/qr-claim';

export default function CoachQr() {
  const [query, setQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedTrick, setSelectedTrick] = useState<CoachTrick>(coachTricks[0]);
  const [selectedQrEvent, setSelectedQrEvent] = useState<StoredQrEvent | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const levels = useMemo(() => Array.from(new Set(coachTricks.map((trick) => trick.level))).sort((a, b) => a - b), []);

  const filteredTricks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const levelFiltered = selectedLevel ? coachTricks.filter((trick) => trick.level === selectedLevel) : coachTricks;
    if (!normalizedQuery) return levelFiltered;

    return levelFiltered.filter((trick) => `${trick.title} ${trick.category} ${trick.bracelet} ${trick.description} Level ${trick.level}`.toLowerCase().includes(normalizedQuery));
  }, [query, selectedLevel]);

  const generateQr = async (trick: CoachTrick) => {
    const now = Date.now();
    const nextValidUntil = new Date(now + 60_000).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setSelectedTrick(trick);
    setGeneratedAt(now);
    setQrModalVisible(true);
    const event = await addQrEvent(trick, nextValidUntil);
    setSelectedQrEvent(event);
  };

  const validUntil = generatedAt ? new Date(generatedAt + 60_000).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null;
  const claimUrl = selectedQrEvent ? `${QR_CLAIM_BASE_URL}?event=${encodeURIComponent(selectedQrEvent.id)}` : QR_CLAIM_BASE_URL;

  return (
    <>
      <Modal visible={qrModalVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setQrModalVisible(false)}>
        <BlurView intensity={80} tint="dark" style={styles.blurOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setQrModalVisible(false)} />
          <View style={styles.qrModal}>
            <View style={styles.qrModalHeader}>
              <StatusPill label={`Level ${selectedTrick.level}`} tone="success" />
              <Text style={styles.qrModalXp}>{selectedTrick.xp} XP</Text>
            </View>
            <Text style={styles.qrModalTitle}>{selectedTrick.title}</Text>
            <Text style={styles.qrModalDiscipline}>{selectedTrick.discipline}</Text>
            <Text style={styles.qrModalMuted}>{selectedTrick.levelTitle} · {selectedTrick.bracelet} náramek</Text>
            <GeneratedQr value={claimUrl} large />
            {generatedAt ? (
              <Text style={styles.qrModalValid}>Platí do {validUntil}</Text>
            ) : null}
            {selectedQrEvent?.syncStatus === 'local' ? (
              <Text style={styles.qrModalWarning}>QR se neuložil do cloudu, takže ho jiné zařízení nemusí najít. Zkontroluj připojení a obnov QR.</Text>
            ) : null}
            {selectedQrEvent ? <Text style={styles.qrModalCode}>Kód: {selectedQrEvent.id}</Text> : null}
            <View style={styles.qrModalActions}>
              <Pressable style={({ pressed }) => [styles.primaryButton, { flex: 1 }, pressed && { opacity: 0.86 }]} onPress={() => generateQr(selectedTrick)}>
                <Text style={styles.primaryButtonText}>Obnovit QR na 60 s</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.86 }]} onPress={() => setQrModalVisible(false)}>
                <Text style={styles.closeButtonText}>Zavřít</Text>
              </Pressable>
            </View>
          </View>
        </BlurView>
      </Modal>

      <ScrollView style={styles.page} contentContainerStyle={styles.container}>
        <CoachPageHeader
          kicker="Trenér · QR triky"
          title="QR kódy za splněný trik"
          subtitle="Vyber trik, zobraz aktuální kód a předej dítěti odměnu. Obrazovka je udělaná pro rychlé použití uprostřed tréninku."
          icon="grid"
          metrics={[
            { label: 'Triků v knihovně', value: String(coachTricks.length), tone: 'blue' },
            { label: 'Platnost kódu', value: '60 s', tone: 'teal' },
            { label: 'Levely', value: String(levels.length), tone: 'amber' },
          ]}
        />

        <CoachCard title="Vyhledat trik" subtitle="Hledej podle názvu, levelu, disciplíny nebo náramku.">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Název triku, kategorie, level nebo náramek"
            placeholderTextColor={CoachColors.slateMuted}
            style={styles.input}
          />
          <View style={styles.levelFilter}>
            <Pressable onPress={() => setSelectedLevel(null)} style={({ pressed }) => [styles.levelButton, selectedLevel === null && styles.levelButtonSelected, pressed && { opacity: 0.86 }]}>
              <Text style={selectedLevel === null ? styles.selectedText : styles.chooseText}>Vše</Text>
            </Pressable>
            {levels.map((level) => (
              <Pressable key={level} onPress={() => setSelectedLevel(level)} style={({ pressed }) => [styles.levelButton, selectedLevel === level && styles.levelButtonSelected, pressed && { opacity: 0.86 }]}>
                <Text style={selectedLevel === level ? styles.selectedText : styles.chooseText}>Level {level}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.trickGrid}>
            {filteredTricks.map((trick) => {
              const isSelected = trick.id === selectedTrick.id;
              return (
                <Pressable key={trick.id} onPress={() => generateQr(trick)} style={({ pressed }) => [styles.trickCard, isSelected && styles.trickCardSelected, pressed && { opacity: 0.86 }]}>
                  <View style={styles.trickHeader}>
                    <StatusPill label={`Level ${trick.level}`} tone={isSelected ? 'success' : 'neutral'} />
                    <Text style={styles.xp}>{trick.xp} XP</Text>
                  </View>
                  <Text style={styles.cardTitle}>{trick.title}</Text>
                  <Text style={styles.discipline}>{trick.discipline}</Text>
                  <Text style={styles.muted}>{trick.levelTitle} · {trick.bracelet} náramek</Text>
                  <Text style={styles.description}>{trick.description}</Text>
                  <Text style={isSelected ? styles.selectedText : styles.chooseText}>
                    {isSelected ? 'Zobrazit QR' : 'Vygenerovat QR'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </CoachCard>
      </ScrollView>
    </>
  );
}

function GeneratedQr({ value, large }: { value: string; large?: boolean }) {
  const size = large ? 280 : 148;

  return (
    <View style={styles.qrBox}>
      <QRCode value={value} size={size - 16} color={CoachColors.slate} backgroundColor="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: CoachColors.bg },
  container: { width: '100%', maxWidth: 860, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 104 },
  muted: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19 },
  cardTitle: { color: CoachColors.slate, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  input: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, color: CoachColors.slate, padding: Spacing.md, fontSize: 15 },
  levelFilter: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  levelButton: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  levelButtonSelected: { borderColor: CoachColors.blue, backgroundColor: CoachColors.blueSoft },
  trickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  trickCard: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm, minWidth: 240, flex: 1 },
  trickCardSelected: { borderColor: CoachColors.blue, backgroundColor: CoachColors.blueSoft },
  trickHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md, alignItems: 'center' },
  xp: { color: CoachColors.slate, fontWeight: '900' },
  discipline: { color: CoachColors.blue, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  description: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19 },
  chooseText: { color: CoachColors.blue, fontWeight: '900' },
  selectedText: { color: CoachColors.blue, fontWeight: '900' },
  qrBox: { backgroundColor: '#fff', borderRadius: Radius.sm, padding: 8 },
  primaryButton: { alignSelf: 'flex-start', backgroundColor: CoachColors.blue, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  primaryButtonText: { color: '#fff', fontWeight: '900', textAlign: 'center' },
  // Modal
  blurOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  qrModal: { backgroundColor: CoachColors.panel, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md, alignItems: 'center', width: '88%', maxWidth: 380, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.24, shadowRadius: 24, elevation: 20 },
  qrModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  qrModalXp: { color: CoachColors.slate, fontWeight: '900', fontSize: 15 },
  qrModalTitle: { color: CoachColors.slate, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  qrModalDiscipline: { color: CoachColors.blue, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  qrModalMuted: { color: CoachColors.slateMuted, fontSize: 13 },
  qrModalValid: { color: CoachColors.teal, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  qrModalWarning: { color: CoachColors.red, fontSize: 12, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  qrModalCode: { color: CoachColors.slateMuted, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  qrModalActions: { flexDirection: 'row', gap: Spacing.sm, width: '100%', marginTop: Spacing.sm },
  closeButton: { backgroundColor: CoachColors.panelAlt, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  closeButtonText: { color: CoachColors.slateMuted, fontWeight: '900' },
});