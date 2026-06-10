import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { CoachCard, CoachPageHeader } from '@/components/coach/coach-screen';
import { StatusPill } from '@/components/parent-card';
import { useCoachOperations } from '@/hooks/use-coach-operations';
import { useCoachWards } from '@/hooks/use-coach-wards';
import { useCourseDocuments } from '@/hooks/use-course-documents';
import { useManualTrickAwards } from '@/hooks/use-manual-trick-awards';
import {
    coachTricks,
    departureModeLabel,
    skillTreeProgressForWard,
    type CoachWardSkillTrick,
} from '@/lib/coach-content';
import { CoachColors, CoachShadow } from '@/lib/coach-theme';
import { documentStatusLabel } from '@/lib/course-documents';
import { Radius, Spacing } from '@/lib/theme';

type TrickFilter = 'missing' | 'completed' | 'all';

export default function CoachWardDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [filter, setFilter] = useState<TrickFilter>('missing');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [trickQuery, setTrickQuery] = useState('');
  const [selectedTrickId, setSelectedTrickId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const { wards, loading: wardsLoading } = useCoachWards();
  const ward = typeof id === 'string' ? wards.find((item) => item.id === id) ?? null : null;
  const { awards, awardManualTrick } = useManualTrickAwards();
  const { childAttendanceRecords } = useCoachOperations();
  const { documents } = useCourseDocuments();

  // Real documents the parent filled in for this child (GDPR, health, departure
  // consent, …). Sorted with signed first, then by latest update.
  const wardDocuments = useMemo(() => {
    if (!ward) return [];
    return documents
      .filter((doc) => doc.participantId === ward.id)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'signed' ? -1 : 1;
        return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '');
      });
  }, [documents, ward]);

  // Departure consent reflects the actual signed "departure" document.
  const departureDocument = useMemo(
    () => wardDocuments.find((doc) => doc.kind === 'departure') ?? null,
    [wardDocuments],
  );

  // Match completed-trick awards by BOTH ward_id and participant_id. Children
  // registered via the web parent flow live in the `participants` table, so their
  // QR-claimed tricks are stored with participant_id set and ward_id = null.
  // ward.id equals the participant id for those children, so matching only on
  // ward_id would miss every trick they unlocked.
  const wardAwards = useMemo(() => {
    if (!ward) return [];
    return awards.filter((award) => award.wardId === ward.id || award.participantId === ward.id);
  }, [awards, ward]);
  const progress = useMemo(() => ward ? skillTreeProgressForWard(ward, wardAwards.map((award) => award.trickId)) : null, [ward, wardAwards]);
  const levels = useMemo(() => Array.from(new Set(coachTricks.map((trick) => trick.level))).sort((a, b) => a - b), []);
  const attendance = useMemo(() => {
    if (!ward) return [];
    return childAttendanceRecords
      .map<AttendanceRecord | null>((record) => {
        const attendee = record.attendees.find((item) => item.name === ward.name);
        return attendee ? { id: record.id, date: record.date, location: record.location, attendee } : null;
      })
      .filter((record): record is AttendanceRecord => record !== null);
  }, [childAttendanceRecords, ward]);
  const normalizedTrickQuery = normalizeSearch(trickQuery);

  const manualCandidates = useMemo(() => {
    if (!progress) return [];
    const source = normalizedTrickQuery
      ? progress.missing.filter((trick) => normalizeSearch(`${trick.title} ${trick.discipline} ${trick.levelTitle} ${trick.bracelet}`).includes(normalizedTrickQuery))
      : progress.missing;

    return source.slice(0, 6);
  }, [normalizedTrickQuery, progress]);

  const selectedManualTrick = manualCandidates.find((trick) => trick.id === selectedTrickId) ?? manualCandidates[0] ?? null;

  const visibleTricks = useMemo(() => {
    if (!progress) return [];
    return progress.tricks.filter((trick) => {
      const matchesFilter = filter === 'all' || (filter === 'completed' ? trick.completed : !trick.completed);
      const matchesLevel = selectedLevel === null || trick.level === selectedLevel;
      return matchesFilter && matchesLevel;
    });
  }, [filter, progress, selectedLevel]);

  const handleManualAward = async () => {
    if (!ward || !selectedManualTrick) return;

    const award = await awardManualTrick({ wardId: ward.id, participantName: ward.name, trick: selectedManualTrick });
    setMessage(`${award.trickTitle} přidáno dítěti ${ward.name}.`);
    setFilter('completed');
    setSelectedLevel(selectedManualTrick.level);
    setSelectedTrickId(null);
    setTrickQuery('');
  };

  if (wardsLoading) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.container}>
        <CoachCard>
          <Text style={styles.cardTitle}>Načítám detail svěřence…</Text>
          <Text style={styles.muted}>Beru aktuální data z databáze.</Text>
        </CoachCard>
      </ScrollView>
    );
  }

  if (!ward || !progress) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.container}>
        <CoachCard>
          <Text style={styles.cardTitle}>Dítě nenalezeno</Text>
          <Text style={styles.muted}>Vybraný svěřenec není v trenérském seznamu.</Text>
          <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.84 }]} onPress={() => router.push('/wards' as never)}>
            <Feather name="arrow-left" size={18} color={CoachColors.blue} />
            <Text style={styles.backText}>Zpět na svěřence</Text>
          </Pressable>
        </CoachCard>
      </ScrollView>
    );
  }

  const departureSigned = departureDocument?.status === 'signed';
  const departureSignedAt = departureDocument?.signedAt ?? '';
  const departureTone = !departureSigned ? 'danger' : ward.departure.mode === 'alone' ? 'success' : 'warning';
  const canLeaveAlone = departureSigned && ward.departure.mode === 'alone';

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.topActions}>
        <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.84 }]} onPress={() => router.push('/wards' as never)}>
          <Feather name="arrow-left" size={18} color={CoachColors.blue} />
          <Text style={styles.backText}>Svěřenci</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.callButton, pressed && { opacity: 0.86 }]} onPress={() => callPhone(ward.parentPhone)}>
          <Feather name="phone" size={17} color="#fff" />
          <Text style={styles.callButtonText}>Zavolat rodiči</Text>
        </Pressable>
      </View>

      <CoachPageHeader
        kicker="Trenér · Detail dítěte"
        title={ward.name}
        subtitle={`${ward.locations.join(' · ')} · ${ward.bracelet} náramek · ${progress.completedCount}/${progress.total} triků hotovo`}
        icon="user-check"
        metrics={[
          { label: 'Triky hotovo', value: `${progress.completedCount}/${progress.total}`, tone: 'teal' },
          { label: 'Permanentka', value: String(ward.entriesLeft), tone: 'blue' },
          { label: 'Docházka', value: String(attendance.length), tone: 'amber' },
        ]}
      />

      <CoachCard title="Rychlý přehled">
        <View style={styles.headerRow}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text style={styles.name}>{ward.name}</Text>
            <Text style={styles.muted}>{[ward.schoolYear, ward.birthYear ? `ročník ${ward.birthYear}` : ''].filter(Boolean).join(' · ') || 'Bez ročníku'}</Text>
          </View>
          <StatusPill label={ward.paymentStatus} tone={ward.paymentStatus === 'Zaplaceno' ? 'success' : 'warning'} />
        </View>

        <View style={styles.summaryGrid}>
          <InfoBox label="Rodič" value={ward.parentName || '—'} subvalue={ward.parentPhone || 'Bez telefonu'} />
          <InfoBox label="NFC" value={ward.hasNfcChip ? ward.nfcChipId ?? 'Má čip' : 'Bez čipu'} subvalue={ward.hasNfcChip ? 'Docházka přes telefon' : 'Ruční zápis na místě'} />
          <InfoBox label="Permanentka" value={`${ward.entriesLeft} vstupů`} subvalue={ward.passTitle || 'Bez permanentky'} />
          <InfoBox label="Naposledy" value={ward.lastAttendance || '—'} subvalue="Docházka dítěte" />
        </View>
      </CoachCard>

      <CoachCard title="Odchod a souhlasy">
        <View style={[styles.consentPanel, departureTone === 'success' && styles.consentSuccess, departureTone === 'warning' && styles.consentWarning, departureTone === 'danger' && styles.consentDanger]}>
          <View style={styles.consentIcon}>
            <Feather name={canLeaveAlone ? 'check-circle' : departureSigned ? 'users' : 'alert-triangle'} size={24} color={CoachColors.slate} />
          </View>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text style={styles.consentTitle}>{departureModeLabel(ward.departure.mode)}</Text>
            <Text style={styles.muted}>{departureSigned ? `Podepsáno ${departureSignedAt}`.trim() : 'Souhlas s odchodem chybí'}</Text>
          </View>
          <StatusPill label={canLeaveAlone ? 'Může jít samo' : departureSigned ? 'Kontrolovat osobu' : 'Nepouštět samo'} tone={departureTone} />
        </View>

        <View style={styles.detailGrid}>
          <InfoBox label="Pověřené osoby" value={ward.departure.authorizedPeople || '—'} />
          <InfoBox label="Poznámka k odchodu" value={ward.departure.note || '—'} />
        </View>
      </CoachCard>

      <CollapsibleCard title="Dokumenty od rodičů" badge={wardDocuments.length > 0 ? `${wardDocuments.length}` : undefined} defaultOpen={false}>
        {wardDocuments.length === 0 ? (
          <Text style={styles.muted}>Rodič zatím nevyplnil žádné dokumenty k tomuto dítěti.</Text>
        ) : (
          <View style={styles.documentList}>
            {wardDocuments.map((doc) => {
              const tone = doc.status === 'signed' ? 'success' : 'warning';
              return (
                <View key={doc.id} style={styles.documentRow}>
                  <View style={styles.documentIcon}>
                    <Feather
                      name={doc.status === 'signed' ? 'check-circle' : 'edit-3'}
                      size={18}
                      color={doc.status === 'signed' ? CoachColors.teal : CoachColors.amber}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.documentTitle}>{doc.title}</Text>
                    <Text style={styles.muted}>
                      {doc.parentName ? `${doc.parentName} · ` : ''}
                      {doc.signedAt ? `Podepsáno ${doc.signedAt}` : `Upraveno ${doc.updatedAt}`}
                    </Text>
                  </View>
                  <StatusPill label={documentStatusLabel(doc.status)} tone={tone} />
                </View>
              );
            })}
          </View>
        )}
      </CollapsibleCard>

      <CollapsibleCard title="Zdraví a docházka" defaultOpen={false}>
        <View style={styles.detailGrid}>
          <InfoBox label="Alergie" value={ward.health.allergies || '—'} />
          <InfoBox label="Omezení" value={ward.health.limits || '—'} />
          <InfoBox label="Léky" value={ward.health.medication || '—'} />
          <InfoBox label="Nouzový kontakt" value={ward.health.emergencyPhone || '—'} />
        </View>
        <View style={styles.noteBox}>
          <Text style={styles.detailLabel}>Poznámka trenéra</Text>
          <Text style={styles.detailValue}>{ward.coachNote || '—'}</Text>
        </View>
        <View style={styles.historyList}>
          {attendance.length === 0 ? <Text style={styles.muted}>Zatím bez docházkového záznamu.</Text> : (
            groupAttendanceByMonth(attendance).map(({ label, items }) => (
              <View key={label}>
                <Text style={styles.monthGroupLabel}>{label}</Text>
                {items.map((record) => (
                  <View key={record.id} style={styles.historyRow}>
                    <Text style={styles.historyDate}>{record.date}</Text>
                    <Text style={styles.muted}>{record.location} · {record.attendee.time} · {record.attendee.method}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      </CollapsibleCard>

      <CollapsibleCard title="Přidat trik ručně" defaultOpen={false}>
        <View style={styles.manualHeader}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text style={styles.cardTitle}>Dítě bez telefonu</Text>
            <Text style={styles.muted}>Trenér vybere dítě, najde trik podle názvu a uloží ho přímo do progresu.</Text>
          </View>
          <StatusPill label={`${progress.missingCount} chybí`} tone="neutral" />
        </View>

        <View style={styles.searchBox}>
          <Feather name="search" size={20} color={CoachColors.slate} />
          <TextInput
            value={trickQuery}
            onChangeText={(value) => {
              setTrickQuery(value);
              setSelectedTrickId(null);
              setMessage('');
            }}
            placeholder="Napiš název triku"
            placeholderTextColor={CoachColors.slateMuted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.candidateGrid}>
          {manualCandidates.map((trick) => {
            const selected = selectedManualTrick?.id === trick.id;
            return (
              <Pressable key={trick.id} onPress={() => setSelectedTrickId(trick.id)} style={({ pressed }) => [styles.candidate, selected && styles.candidateSelected, pressed && { opacity: 0.86 }]}>
                <Text style={styles.trickTitle}>{trick.title}</Text>
                <Text style={styles.muted}>Level {trick.level} · {trick.levelTitle} · {trick.xp} XP</Text>
              </Pressable>
            );
          })}
          {manualCandidates.length === 0 ? <Text style={styles.muted}>Žádný chybějící trik neodpovídá hledání.</Text> : null}
        </View>

        <Pressable disabled={!selectedManualTrick} onPress={handleManualAward} style={({ pressed }) => [styles.primaryButton, !selectedManualTrick && styles.disabledButton, pressed && selectedManualTrick && { opacity: 0.86 }]}>
          <Feather name="plus-circle" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>{selectedManualTrick ? `Přidat ${selectedManualTrick.title}` : 'Vyber trik'}</Text>
        </Pressable>
        {message ? <Text style={styles.successText}>{message}</Text> : null}
      </CollapsibleCard>

      <CollapsibleCard title="Skill tree" badge={`${progress.completedCount}/${progress.total}`} defaultOpen={false}>
        <View style={styles.progressHeader}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text style={styles.cardTitle}>{progress.completedCount} hotovo · {progress.missingCount} chybí</Text>
            <Text style={styles.muted}>Zobrazení se dá filtrovat podle stavu i levelu.</Text>
          </View>
          <StatusPill label={`${Math.round(progress.percent * 100)} %`} tone="success" />
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress.percent * 100}%` }]} />
        </View>

        <View style={styles.filterRow}>
          <FilterButton label="Chybí" selected={filter === 'missing'} onPress={() => setFilter('missing')} />
          <FilterButton label="Splněno" selected={filter === 'completed'} onPress={() => setFilter('completed')} />
          <FilterButton label="Vše" selected={filter === 'all'} onPress={() => setFilter('all')} />
        </View>
        <View style={styles.filterRow}>
          <FilterButton label="Všechny levely" selected={selectedLevel === null} onPress={() => setSelectedLevel(null)} />
          {levels.map((level) => <FilterButton key={level} label={`Level ${level}`} selected={selectedLevel === level} onPress={() => setSelectedLevel(level)} />)}
        </View>

        <View style={styles.trickList}>
          {visibleTricks.map((trick) => <SkillTreeRow key={trick.id} trick={trick} />)}
          {visibleTricks.length === 0 ? <Text style={styles.muted}>Pro tento filtr není žádný trik.</Text> : null}
        </View>
      </CollapsibleCard>
    </ScrollView>
  );
}

function CollapsibleCard({ title, badge, defaultOpen = false, children }: { title: string; badge?: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useSharedValue(defaultOpen ? 1 : 0);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));
  const toggle = () => {
    setOpen((current) => {
      const next = !current;
      rotation.value = withTiming(next ? 1 : 0, { duration: 200 });
      return next;
    });
  };
  return (
    <Animated.View style={styles.collapsibleCard} layout={LinearTransition.duration(220)}>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.collapsibleHeader, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.collapsibleTitleWrap}>
          <Text style={styles.collapsibleTitle}>{title}</Text>
          {badge ? (
            <View style={styles.collapsibleBadge}>
              <Text style={styles.collapsibleBadgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Animated.View style={chevronStyle}>
          <Feather name="chevron-down" size={22} color={CoachColors.slate} />
        </Animated.View>
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={styles.collapsibleBody}>
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function InfoBox({ label, value, subvalue }: { label: string; value: string; subvalue?: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
      {subvalue ? <Text style={styles.muted}>{subvalue}</Text> : null}
    </View>
  );
}

function FilterButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.filterButton, selected && styles.filterButtonSelected, pressed && { opacity: 0.86 }]}>
      <Text style={selected ? styles.filterTextSelected : styles.filterText}>{label}</Text>
    </Pressable>
  );
}

function SkillTreeRow({ trick }: { trick: CoachWardSkillTrick }) {
  return (
    <View style={[styles.trickRow, trick.completed && styles.trickRowDone]}>
      <View style={{ flex: 1, minWidth: 220 }}>
        <Text style={styles.trickTitle}>{trick.title}</Text>
        <Text style={styles.muted}>Level {trick.level} · {trick.levelTitle} · {trick.discipline} · {trick.xp} XP</Text>
        <Text style={styles.trickDescription}>{trick.description}</Text>
      </View>
      <StatusPill label={trick.completed ? trick.manual ? 'Přidáno ručně' : 'Splněno' : 'Chybí'} tone={trick.completed ? 'success' : 'neutral'} />
    </View>
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function callPhone(phone: string) {
  Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => undefined);
}

function parseCzechDateWard(value: string): { year: number; month: number } | null {
  const m = value.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (!m) return null;
  return { month: Number(m[2]) - 1, year: Number(m[3]) };
}

type AttendanceRecord = { id: string; date: string; location: string; attendee: { time: string; method: string } };

function groupAttendanceByMonth(items: AttendanceRecord[]): { label: string; items: AttendanceRecord[] }[] {
  const groups: { key: string; label: string; items: AttendanceRecord[] }[] = [];
  for (const item of items) {
    const p = parseCzechDateWard(item.date);
    const key = p ? `${p.year}-${String(p.month + 1).padStart(2, '0')}` : 'unknown';
    const label = p
      ? new Date(p.year, p.month, 1).toLocaleString('cs-CZ', { month: 'long', year: 'numeric' })
      : 'Neznámé datum';
    const existing = groups.find((g) => g.key === key);
    if (existing) { existing.items.push(item); }
    else { groups.push({ key, label, items: [item] }); }
  }
  return groups;
}

const styles = StyleSheet.create({
  page: { backgroundColor: CoachColors.bg },
  container: { width: '100%', maxWidth: 980, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 108 },
  collapsibleCard: { backgroundColor: CoachColors.panel, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.xxl, overflow: 'hidden', ...CoachShadow.panel },
  collapsibleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, padding: Spacing.lg },
  collapsibleTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, minWidth: 0 },
  collapsibleTitle: { color: CoachColors.slate, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  collapsibleBadge: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 2 },
  collapsibleBadgeText: { color: CoachColors.slateMuted, fontSize: 12, fontWeight: '900' },
  collapsibleBody: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, gap: Spacing.md },
  topActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'space-between', alignItems: 'center' },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: CoachColors.panel, borderColor: CoachColors.borderStrong, borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backText: { color: CoachColors.blue, fontWeight: '900' },
  callButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: CoachColors.slate, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  callButtonText: { color: '#fff', fontWeight: '900' },
  headerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  name: { color: CoachColors.slate, fontSize: 25, lineHeight: 31, fontWeight: '900' },
  muted: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19 },
  cardTitle: { color: CoachColors.slate, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  infoBox: { flexGrow: 1, flexBasis: 210, minWidth: 0, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: 4 },
  detailLabel: { color: CoachColors.slateMuted, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase' },
  detailValue: { color: CoachColors.slate, fontSize: 15, lineHeight: 21, fontWeight: '900' },
  consentPanel: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg },
  consentSuccess: { backgroundColor: CoachColors.tealSoft, borderColor: 'rgba(20,150,128,0.26)' },
  consentWarning: { backgroundColor: CoachColors.amberSoft, borderColor: 'rgba(217,119,6,0.28)' },
  consentDanger: { backgroundColor: CoachColors.redSoft, borderColor: 'rgba(220,38,38,0.24)' },
  consentIcon: { width: 48, height: 48, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.72)' },
  consentTitle: { color: CoachColors.slate, fontSize: 22, lineHeight: 28, fontWeight: '900' },
  noteBox: { backgroundColor: CoachColors.blueSoft, borderColor: 'rgba(37,99,235,0.22)', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: 4 },
  documentList: { gap: Spacing.sm },
  documentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  documentIcon: { width: 34, height: 34, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.72)' },
  documentTitle: { color: CoachColors.slate, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  historyList: { gap: Spacing.sm },
  historyRow: { backgroundColor: CoachColors.panelAlt, borderRadius: Radius.md, padding: Spacing.md, gap: 2 },
  historyDate: { color: CoachColors.slate, fontSize: 15, lineHeight: 21, fontWeight: '900' },
  monthGroupLabel: { color: CoachColors.blue, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: CoachColors.border, marginBottom: Spacing.sm },
  manualHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  searchBox: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.borderStrong, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.md },
  searchInput: { flex: 1, minWidth: 0, color: CoachColors.slate, fontSize: 16, lineHeight: 22, fontWeight: '800', paddingVertical: Spacing.md },
  candidateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  candidate: { flexGrow: 1, flexBasis: 220, minWidth: 0, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: 4 },
  candidateSelected: { backgroundColor: CoachColors.blueSoft, borderColor: CoachColors.blue },
  primaryButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: CoachColors.slate, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  disabledButton: { opacity: 0.48 },
  primaryButtonText: { color: '#fff', fontWeight: '900' },
  successText: { color: CoachColors.teal, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  progressHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  progressTrack: { height: 12, backgroundColor: CoachColors.panelAlt, borderRadius: Radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: CoachColors.teal, borderRadius: Radius.pill },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterButton: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  filterButtonSelected: { backgroundColor: CoachColors.blueSoft, borderColor: CoachColors.blue },
  filterText: { color: CoachColors.blue, fontWeight: '900' },
  filterTextSelected: { color: CoachColors.slate, fontWeight: '900' },
  trickList: { gap: Spacing.sm },
  trickRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.md, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  trickRowDone: { backgroundColor: CoachColors.tealSoft, borderColor: 'rgba(20,150,128,0.22)' },
  trickTitle: { color: CoachColors.slate, fontSize: 16, lineHeight: 22, fontWeight: '900' },
  trickDescription: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19, marginTop: 2 },
});