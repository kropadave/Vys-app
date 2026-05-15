import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CoachCard, CoachPageHeader } from '@/components/coach/coach-screen';
import { StatusPill } from '@/components/parent-card';
import { useManualTrickAwards } from '@/hooks/use-manual-trick-awards';
import { useParticipantSearch } from '@/hooks/use-participant-search';
import {
    coachTricks,
    skillTreeProgressForWard,
    type CoachWard,
    type CoachWardSkillTrick,
} from '@/lib/coach-content';
import { CoachColors } from '@/lib/coach-theme';
import { Radius, Spacing } from '@/lib/theme';

type TrickFilter = 'missing' | 'completed' | 'all';

export default function ParticipantSearch() {
  const router = useRouter();
  const { query, results, loading, search, clear } = useParticipantSearch();
  const [selected, setSelected] = useState<CoachWard | null>(null);
  const inputRef = useRef<TextInput>(null);

  function handleSelect(ward: CoachWard) {
    setSelected(ward);
    inputRef.current?.blur();
  }

  function handleClear() {
    clear();
    setSelected(null);
    inputRef.current?.focus();
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.topActions}>
        <Pressable style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.84 }]} onPress={() => router.push('/wards' as never)}>
          <Feather name="arrow-left" size={18} color={CoachColors.blue} />
          <Text style={styles.backText}>Svěřenci</Text>
        </Pressable>
      </View>

      <CoachPageHeader
        kicker="Trenér · Globální hledání"
        title="Hledat účastníka"
        subtitle="Vyhledej kohokoliv z celé databáze podle jména – pro workshopy, tábory nebo případ, kdy dítě nemá telefon."
        icon="search"
        metrics={[
          { label: 'Výsledky', value: results.length > 0 ? String(results.length) : '—', tone: 'blue' },
          { label: 'Vybráno', value: selected ? selected.name.split(' ')[0] : '—', tone: 'teal' },
        ]}
      />

      <CoachCard title="Hledat podle jména">
        <View style={styles.searchBox}>
          <Feather name="search" size={20} color={CoachColors.slate} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={search}
            placeholder="Napiš jméno nebo příjmení..."
            placeholderTextColor={CoachColors.slateMuted}
            style={styles.searchInput}
            autoCapitalize="words"
            returnKeyType="search"
          />
          {loading ? <ActivityIndicator size="small" color={CoachColors.blue} /> : null}
          {query.length > 0 && !loading ? (
            <Pressable onPress={handleClear} style={({ pressed }) => [styles.clearButton, pressed && { opacity: 0.72 }]}>
              <Feather name="x" size={18} color={CoachColors.slateMuted} />
            </Pressable>
          ) : null}
        </View>

        {query.length > 0 && query.length < 2 ? (
          <Text style={styles.muted}>Napiš aspoň 2 znaky…</Text>
        ) : results.length > 0 ? (
          <View style={styles.resultList}>
            {results.map((ward) => {
              const isSelected = selected?.id === ward.id;
              return (
                <Pressable
                  key={ward.id}
                  onPress={() => handleSelect(ward)}
                  style={({ pressed }) => [styles.resultRow, isSelected && styles.resultRowSelected, pressed && { opacity: 0.86 }]}
                >
                  <View style={{ flex: 1, minWidth: 220 }}>
                    <Text style={styles.resultName}>{ward.name}</Text>
                    <Text style={styles.muted}>{ward.locations.join(' · ') || 'Bez kurzu'} · Level {ward.level} · {ward.bracelet} náramek</Text>
                  </View>
                  <Feather name={isSelected ? 'check-circle' : 'chevron-right'} size={18} color={isSelected ? CoachColors.teal : CoachColors.slateMuted} />
                </Pressable>
              );
            })}
          </View>
        ) : query.length >= 2 && !loading ? (
          <Text style={styles.muted}>Žádný účastník s tímto jménem nebyl nalezen.</Text>
        ) : null}
      </CoachCard>

      {selected ? <ParticipantDetail ward={selected} onClose={() => setSelected(null)} /> : null}
    </ScrollView>
  );
}

function ParticipantDetail({ ward, onClose }: { ward: CoachWard; onClose: () => void }) {
  const { awards, awardManualTrick } = useManualTrickAwards();
  const [filter, setFilter] = useState<TrickFilter>('missing');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [trickQuery, setTrickQuery] = useState('');
  const [selectedTrickId, setSelectedTrickId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const wardAwards = useMemo(() => awards.filter((a) => a.wardId === ward.id || a.participantId === ward.id), [awards, ward.id]);
  const progress = useMemo(() => skillTreeProgressForWard(ward, wardAwards.map((a) => a.trickId)), [ward, wardAwards]);
  const levels = useMemo(() => Array.from(new Set(coachTricks.map((t) => t.level))).sort((a, b) => a - b), []);
  const normalizedTrickQuery = normalizeSearch(trickQuery);

  const manualCandidates = useMemo(() => {
    const source = normalizedTrickQuery
      ? progress.missing.filter((t) => normalizeSearch(`${t.title} ${t.discipline} ${t.levelTitle} ${t.bracelet}`).includes(normalizedTrickQuery))
      : progress.missing;
    return source.slice(0, 6);
  }, [normalizedTrickQuery, progress]);

  const selectedManualTrick = manualCandidates.find((t) => t.id === selectedTrickId) ?? manualCandidates[0] ?? null;

  const visibleTricks = useMemo(() => {
    return progress.tricks.filter((t) => {
      const matchesFilter = filter === 'all' || (filter === 'completed' ? t.completed : !t.completed);
      const matchesLevel = selectedLevel === null || t.level === selectedLevel;
      return matchesFilter && matchesLevel;
    });
  }, [filter, progress, selectedLevel]);

  const handleManualAward = async () => {
    if (!selectedManualTrick) return;
    const award = await awardManualTrick({ wardId: ward.id, participantId: ward.id, participantName: ward.name, trick: selectedManualTrick });
    setMessage(`${award.trickTitle} přidáno dítěti ${ward.name}.`);
    setFilter('completed');
    setSelectedLevel(selectedManualTrick.level);
    setSelectedTrickId(null);
    setTrickQuery('');
  };

  return (
    <>
      <CoachCard title="Vybraný účastník">
        <View style={styles.headerRow}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text style={styles.name}>{ward.name}</Text>
            <Text style={styles.muted}>{ward.locations.join(' · ') || 'Bez aktivního kurzu'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
            {ward.parentPhone ? (
              <Pressable style={({ pressed }) => [styles.callButton, pressed && { opacity: 0.86 }]} onPress={() => Linking.openURL(`tel:${ward.parentPhone.replace(/\s+/g, '')}`).catch(() => undefined)}>
                <Feather name="phone" size={15} color="#fff" />
                <Text style={styles.callButtonText}>Zavolat rodiči</Text>
              </Pressable>
            ) : null}
            <Pressable style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.84 }]} onPress={onClose}>
              <Feather name="x" size={16} color={CoachColors.slateMuted} />
            </Pressable>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <InfoBox label="Rodič" value={ward.parentName || '—'} subvalue={ward.parentPhone || undefined} />
          <InfoBox label="Náramek" value={ward.bracelet} subvalue={`Level ${ward.level}`} />
          <InfoBox label="Progress" value={`${progress.completedCount}/${progress.total} triků`} subvalue={`${Math.round(progress.percent * 100)} % hotovo`} />
          <InfoBox label="Ročník / škola" value={ward.schoolYear || '—'} />
        </View>
      </CoachCard>

      <CoachCard title="Zdraví">
        <View style={styles.detailGrid}>
          <InfoBox label="Alergie" value={ward.health.allergies || 'Žádné'} />
          <InfoBox label="Zdravotní omezení" value={ward.health.limits || 'Bez omezení'} />
          <InfoBox label="Léky" value={ward.health.medication || 'Bez léků'} />
          <InfoBox label="Nouzový kontakt" value={ward.health.emergencyPhone || '—'} />
        </View>
        {ward.coachNote ? (
          <View style={styles.noteBox}>
            <Text style={styles.detailLabel}>Poznámka trenéra</Text>
            <Text style={styles.detailValue}>{ward.coachNote}</Text>
          </View>
        ) : null}
      </CoachCard>

      <CoachCard title="Přidat trik ručně">
        <View style={styles.manualHeader}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text style={styles.cardTitle}>Dítě bez telefonu</Text>
            <Text style={styles.muted}>Najdi trik podle názvu a přidej ho přímo do progresu {ward.name.split(' ')[0]}.</Text>
          </View>
          <StatusPill label={`${progress.missingCount} chybí`} tone="neutral" />
        </View>

        <View style={styles.searchBox}>
          <Feather name="search" size={20} color={CoachColors.slate} />
          <TextInput
            value={trickQuery}
            onChangeText={(v) => { setTrickQuery(v); setSelectedTrickId(null); setMessage(''); }}
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

        <Pressable
          disabled={!selectedManualTrick}
          onPress={handleManualAward}
          style={({ pressed }) => [styles.primaryButton, !selectedManualTrick && styles.disabledButton, pressed && selectedManualTrick && { opacity: 0.86 }]}
        >
          <Feather name="plus-circle" size={18} color="#fff" />
          <Text style={styles.primaryButtonText}>{selectedManualTrick ? `Přidat ${selectedManualTrick.title}` : 'Vyber trik'}</Text>
        </Pressable>
        {message ? <Text style={styles.successText}>{message}</Text> : null}
      </CoachCard>

      <CoachCard title="Skill tree">
        <View style={styles.progressHeader}>
          <View style={{ flex: 1, minWidth: 220 }}>
            <Text style={styles.cardTitle}>{progress.completedCount} hotovo · {progress.missingCount} chybí</Text>
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
      </CoachCard>
    </>
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
      <StatusPill label={trick.completed ? (trick.manual ? 'Přidáno ručně' : 'Splněno') : 'Chybí'} tone={trick.completed ? 'success' : 'neutral'} />
    </View>
  );
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

const styles = StyleSheet.create({
  page: { backgroundColor: CoachColors.bg },
  container: { width: '100%', maxWidth: 980, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 108 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: CoachColors.panel, borderColor: CoachColors.borderStrong, borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backText: { color: CoachColors.blue, fontWeight: '900' },
  callButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: CoachColors.slate, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  callButtonText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  closeButton: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.pill, padding: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  name: { color: CoachColors.slate, fontSize: 22, lineHeight: 28, fontWeight: '900' },
  muted: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19 },
  cardTitle: { color: CoachColors.slate, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  searchBox: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.borderStrong, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.md },
  searchInput: { flex: 1, minWidth: 0, color: CoachColors.slate, fontSize: 16, lineHeight: 22, fontWeight: '800', paddingVertical: Spacing.md },
  clearButton: { padding: Spacing.sm },
  resultList: { gap: Spacing.sm },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  resultRowSelected: { backgroundColor: CoachColors.tealSoft, borderColor: 'rgba(20,150,128,0.28)' },
  resultName: { color: CoachColors.slate, fontSize: 16, lineHeight: 22, fontWeight: '900' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  infoBox: { flexGrow: 1, flexBasis: 210, minWidth: 0, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: 4 },
  detailLabel: { color: CoachColors.slateMuted, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase' },
  detailValue: { color: CoachColors.slate, fontSize: 15, lineHeight: 21, fontWeight: '900' },
  noteBox: { backgroundColor: CoachColors.blueSoft, borderColor: 'rgba(37,99,235,0.22)', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: 4 },
  manualHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  candidateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  candidate: { flexGrow: 1, flexBasis: 220, minWidth: 0, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: 4 },
  candidateSelected: { backgroundColor: CoachColors.blueSoft, borderColor: CoachColors.blue },
  trickTitle: { color: CoachColors.slate, fontSize: 16, lineHeight: 22, fontWeight: '900' },
  trickDescription: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19, marginTop: 2 },
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
});
