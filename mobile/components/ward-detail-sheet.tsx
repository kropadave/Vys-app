import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { StatusPill } from '@/components/parent-card';
import { useCoachOperations } from '@/hooks/use-coach-operations';
import { useManualTrickAwards } from '@/hooks/use-manual-trick-awards';
import { Brand } from '@/lib/brand';
import {
    coachTricks,
    departureModeLabel,
    skillTreeProgressForWard,
    type CoachWard,
    type CoachWardSkillTrick,
} from '@/lib/coach-content';
import { Palette, Radius, Spacing } from '@/lib/theme';

type Tab = 'overview' | 'departure' | 'health' | 'attendance' | 'tricks';
type TrickFilter = 'missing' | 'completed' | 'all';

const TABS: { id: Tab; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { id: 'overview', label: 'Přehled', icon: 'user' },
  { id: 'departure', label: 'Odchod', icon: 'log-out' },
  { id: 'health', label: 'Zdraví', icon: 'heart' },
  { id: 'attendance', label: 'Docházka', icon: 'calendar' },
  { id: 'tricks', label: 'Triky', icon: 'zap' },
];

export function WardDetailSheet({ wardId, ward: providedWard, wards = [], attendanceLocations, onClose }: { wardId: string | null; ward?: CoachWard | null; wards?: CoachWard[]; attendanceLocations?: string[]; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [filter, setFilter] = useState<TrickFilter>('missing');
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [trickQuery, setTrickQuery] = useState('');
  const [selectedTrickId, setSelectedTrickId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Attendance tab state
  const [attDate, setAttDate] = useState('');
  const [attLocation, setAttLocation] = useState('');
  const [attMessage, setAttMessage] = useState('');
  const [attSaving, setAttSaving] = useState(false);

  const ward = providedWard ?? (wardId ? wards.find((item) => item.id === wardId) ?? null : null);
  const availableAttendanceLocations = attendanceLocations?.length ? attendanceLocations : ward?.locations ?? [];
  const { awards, awardManualTrick } = useManualTrickAwards();
  const { childAttendanceRecords, addChildAttendanceEntry } = useCoachOperations();

  const wardAwards = useMemo(() => {
    if (!ward) return [];
    return awards.filter((a) => a.wardId === ward.id);
  }, [awards, ward]);

  const progress = useMemo(
    () => (ward ? skillTreeProgressForWard(ward, wardAwards.map((a) => a.trickId)) : null),
    [ward, wardAwards],
  );

  const levels = useMemo(
    () => Array.from(new Set(coachTricks.map((t) => t.level))).sort((a, b) => a - b),
    [],
  );

  const attendance = useMemo(() => {
    if (!ward) return [];
    return childAttendanceRecords
      .map((record) => {
        const attendee = record.attendees.find((a) => a.name === ward.name);
        return attendee ? { ...record, attendee } : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [childAttendanceRecords, ward]);

  const normalizedQuery = normalizeSearch(trickQuery);

  const manualCandidates = useMemo(() => {
    if (!progress) return [];
    const source = normalizedQuery
      ? progress.missing.filter((t) =>
          normalizeSearch(`${t.title} ${t.discipline} ${t.levelTitle} ${t.bracelet}`).includes(normalizedQuery),
        )
      : progress.missing;
    return source.slice(0, 6);
  }, [normalizedQuery, progress]);

  const selectedManualTrick = manualCandidates.find((t) => t.id === selectedTrickId) ?? manualCandidates[0] ?? null;

  const visibleTricks = useMemo(() => {
    if (!progress) return [];
    return progress.tricks.filter((t) => {
      const matchesFilter = filter === 'all' || (filter === 'completed' ? t.completed : !t.completed);
      const matchesLevel = selectedLevel === null || t.level === selectedLevel;
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

  const handleClose = () => {
    setActiveTab('overview');
    setFilter('missing');
    setSelectedLevel(null);
    setTrickQuery('');
    setSelectedTrickId(null);
    setMessage('');
    setAttDate('');
    setAttLocation('');
    setAttMessage('');
    onClose();
  };

  const handleAddAttendance = async () => {
    if (!ward || !attDate.trim() || !attLocation.trim() || attSaving) return;
    setAttSaving(true);
    // Parse date string like "24.4.2026" or "24. 4. 2026" into ISO key "2026-04-24"
    const isoKey = parseDateToIso(attDate.trim());
    await addChildAttendanceEntry({
      location: attLocation.trim(),
      participantName: ward.name,
      method: 'Ručně',
      dateOverride: isoKey ? { isoKey, label: attDate.trim() } : undefined,
    });
    setAttMessage(`Docházka pro ${ward.name} zapsána.`);
    setAttDate('');
    setAttSaving(false);
  };

  if (!ward || !progress) return null;

  const departureTone = !ward.departure.signed ? 'danger' : ward.departure.mode === 'alone' ? 'success' : 'warning';
  const canLeaveAlone = ward.departure.signed && ward.departure.mode === 'alone';

  return (
    <Modal visible={wardId !== null} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <LinearGradient colors={[Brand.purple, Brand.pink]} style={styles.headerGradient} />
            <View style={styles.headerContent}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.sheetName}>{ward.name}</Text>
                <Text style={styles.sheetSub}>
                  {ward.bracelet} náramek · level {ward.level} · {ward.locations.join(' · ')}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.82 }]}
                  onPress={() => Linking.openURL(`tel:${ward.parentPhone.replace(/\s+/g, '')}`).catch(() => undefined)}
                >
                  <Feather name="phone" size={15} color="#fff" />
                  <Text style={styles.callBtnText}>Zavolat</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.72 }]}
                  onPress={handleClose}
                >
                  <Feather name="x" size={20} color="rgba(255,255,255,0.9)" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* Tab bar */}
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && { opacity: 0.8 }]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Feather name={tab.icon} size={20} color={active ? Brand.purple : Palette.textMuted} />
                </Pressable>
              );
            })}
          </View>

          {/* Content */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'overview' && (
              <View style={styles.section}>
                <View style={styles.headerRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.cardTitle}>{ward.name}</Text>
                    <Text style={styles.muted}>{ward.schoolYear} · ročník {ward.birthYear}</Text>
                  </View>
                  <StatusPill label={ward.paymentStatus} tone={ward.paymentStatus === 'Zaplaceno' ? 'success' : 'warning'} />
                </View>

                <View style={styles.grid}>
                  <InfoBox label="Rodič" value={ward.parentName} subvalue={ward.parentPhone} />
                  <InfoBox label="NFC" value={ward.hasNfcChip ? ward.nfcChipId ?? 'Má čip' : 'Bez čipu'} subvalue={ward.hasNfcChip ? 'Docházka přes telefon' : 'Ruční zápis na místě'} />
                  <InfoBox label="Permanentka" value={`${ward.entriesLeft} vstupů`} subvalue={ward.passTitle} />
                  <InfoBox label="Naposledy" value={ward.lastAttendance} subvalue="Docházka dítěte" />
                </View>

                <View style={styles.progressBlock}>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>{progress.completedCount} / {progress.total} triků</Text>
                    <Text style={styles.progressMeta}>{Math.round(progress.percent * 100)} %</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress.percent * 100}%` }]} />
                  </View>
                </View>
              </View>
            )}

            {activeTab === 'departure' && (
              <View style={styles.section}>
                <View style={[
                  styles.consentPanel,
                  departureTone === 'success' && styles.consentSuccess,
                  departureTone === 'warning' && styles.consentWarning,
                  departureTone === 'danger' && styles.consentDanger,
                ]}>
                  <View style={styles.consentIcon}>
                    <Feather name={canLeaveAlone ? 'check-circle' : ward.departure.signed ? 'users' : 'alert-triangle'} size={22} color={Palette.text} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.consentTitle}>{departureModeLabel(ward.departure.mode)}</Text>
                    <Text style={styles.muted}>{ward.departure.signed ? `Podepsáno ${ward.departure.signedAt}` : 'Souhlas s odchodem chybí'}</Text>
                  </View>
                  <StatusPill label={canLeaveAlone ? 'Může jít samo' : ward.departure.signed ? 'Kontrolovat osobu' : 'Nepouštět samo'} tone={departureTone} />
                </View>

                <View style={styles.grid}>
                  <InfoBox label="Pověřené osoby" value={ward.departure.authorizedPeople} />
                  <InfoBox label="Poznámka k odchodu" value={ward.departure.note} />
                </View>
              </View>
            )}

            {activeTab === 'health' && (
              <View style={styles.section}>
                <View style={styles.grid}>
                  <InfoBox label="Alergie" value={ward.health.allergies} />
                  <InfoBox label="Omezení" value={ward.health.limits} />
                  <InfoBox label="Léky" value={ward.health.medication} />
                  <InfoBox label="Nouzový kontakt" value={ward.health.emergencyPhone} />
                </View>
              </View>
            )}

            {activeTab === 'attendance' && (
              <View style={styles.section}>
                {/* Retroactive entry form */}
                <View style={styles.manualBlock}>
                  <View style={styles.manualHeader}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.cardTitle}>Zpětně zapsat docházku</Text>
                      <Text style={styles.muted}>Zadej datum a lokalitu pro ruční zápis.</Text>
                    </View>
                    <StatusPill label={`${attendance.length}x celkem`} tone="neutral" />
                  </View>

                  <View style={styles.attRow}>
                    <View style={[styles.searchBox, styles.attField]}>
                      <Feather name="calendar" size={16} color={Palette.primaryDark} />
                      <TextInput
                        value={attDate}
                        onChangeText={setAttDate}
                        placeholder="Datum  (24. 4. 2026)"
                        placeholderTextColor={Palette.textSubtle}
                        style={styles.searchInput}
                      />
                    </View>
                  </View>

                  <View style={styles.locationChips}>
                    {availableAttendanceLocations.map((label) => {
                      const active = attLocation === label;
                      return (
                        <Pressable key={label} onPress={() => setAttLocation(label)} style={({ pressed }) => [styles.locationChip, active && styles.locationChipActive, pressed && { opacity: 0.8 }]}>
                          <Text style={[styles.locationChipText, active && styles.locationChipTextActive]}>{label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {availableAttendanceLocations.length === 0 ? <Text style={styles.muted}>Účastník zatím nemá přiřazenou lokalitu.</Text> : null}

                  <Pressable
                    disabled={!attDate.trim() || !attLocation || attSaving}
                    onPress={handleAddAttendance}
                    style={({ pressed }) => [styles.primaryButton, (!attDate.trim() || !attLocation) && styles.disabledButton, pressed && attDate.trim() && attLocation && { opacity: 0.86 }]}
                  >
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={styles.primaryButtonText}>{attSaving ? 'Ukládám…' : 'Zapsat docházku'}</Text>
                  </Pressable>
                  {attMessage ? <Text style={styles.successText}>{attMessage}</Text> : null}
                </View>

                {/* History */}
                <Text style={styles.sectionTitle}>Historie · {attendance.length} záznamů</Text>
                {attendance.length === 0 ? (
                  <Text style={styles.muted}>Zatím bez záznamu docházky.</Text>
                ) : (
                  <View style={styles.historyList}>
                    {attendance.map((record) => (
                      <View key={record.id} style={styles.historyRow}>
                        <View style={styles.historyRowInner}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.historyDate}>{record.date}</Text>
                            <Text style={styles.muted}>{record.location}</Text>
                          </View>
                          <View style={styles.attBadge}>
                            <Feather name={record.attendee.method === 'NFC' ? 'wifi' : 'edit-2'} size={11} color={Palette.primaryDark} />
                            <Text style={styles.attBadgeText}>{record.attendee.time} · {record.attendee.method}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'tricks' && (
              <View style={styles.section}>
                {/* Manual award */}
                <View style={styles.manualBlock}>
                  <View style={styles.manualHeader}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.cardTitle}>Přidat trik ručně</Text>
                      <Text style={styles.muted}>Pro dítě bez telefonu — vyhledej trik a ulož do progresu.</Text>
                    </View>
                    <StatusPill label={`${progress.missingCount} chybí`} tone="neutral" />
                  </View>

                  <View style={styles.searchBox}>
                    <Feather name="search" size={18} color={Palette.primaryDark} />
                    <TextInput
                      value={trickQuery}
                      onChangeText={(v) => { setTrickQuery(v); setSelectedTrickId(null); setMessage(''); }}
                      placeholder="Název triku"
                      placeholderTextColor={Palette.textSubtle}
                      style={styles.searchInput}
                    />
                  </View>

                  <View style={styles.candidateGrid}>
                    {manualCandidates.map((trick) => {
                      const sel = selectedManualTrick?.id === trick.id;
                      return (
                        <Pressable key={trick.id} onPress={() => setSelectedTrickId(trick.id)} style={({ pressed }) => [styles.candidate, sel && styles.candidateSelected, pressed && { opacity: 0.86 }]}>
                          <Text style={styles.trickTitle}>{trick.title}</Text>
                          <Text style={styles.muted}>Level {trick.level} · {trick.xp} XP</Text>
                        </Pressable>
                      );
                    })}
                    {manualCandidates.length === 0 && <Text style={styles.muted}>Žádný chybějící trik.</Text>}
                  </View>

                  <Pressable
                    disabled={!selectedManualTrick}
                    onPress={handleManualAward}
                    style={({ pressed }) => [styles.primaryButton, !selectedManualTrick && styles.disabledButton, pressed && selectedManualTrick && { opacity: 0.86 }]}
                  >
                    <Feather name="plus-circle" size={16} color="#fff" />
                    <Text style={styles.primaryButtonText}>{selectedManualTrick ? `Přidat ${selectedManualTrick.title}` : 'Vyber trik'}</Text>
                  </Pressable>
                  {message ? <Text style={styles.successText}>{message}</Text> : null}
                </View>

                {/* Skill tree */}
                <Text style={styles.sectionTitle}>Skill tree · {progress.completedCount}/{progress.total}</Text>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress.percent * 100}%` }]} />
                </View>

                <View style={styles.filterRow}>
                  <FilterBtn label="Chybí" selected={filter === 'missing'} onPress={() => setFilter('missing')} />
                  <FilterBtn label="Splněno" selected={filter === 'completed'} onPress={() => setFilter('completed')} />
                  <FilterBtn label="Vše" selected={filter === 'all'} onPress={() => setFilter('all')} />
                </View>
                <View style={styles.filterRow}>
                  <FilterBtn label="Všechny" selected={selectedLevel === null} onPress={() => setSelectedLevel(null)} />
                  {levels.map((lv) => (
                    <FilterBtn key={lv} label={`L${lv}`} selected={selectedLevel === lv} onPress={() => setSelectedLevel(lv)} />
                  ))}
                </View>

                <View style={styles.trickList}>
                  {visibleTricks.map((trick) => <TrickRow key={trick.id} trick={trick} />)}
                  {visibleTricks.length === 0 && <Text style={styles.muted}>Pro tento filtr není žádný trik.</Text>}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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

function FilterBtn({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.filterButton, selected && styles.filterButtonSelected, pressed && { opacity: 0.86 }]}>
      <Text style={selected ? styles.filterTextSelected : styles.filterText}>{label}</Text>
    </Pressable>
  );
}

function TrickRow({ trick }: { trick: CoachWardSkillTrick }) {
  return (
    <View style={[styles.trickRow, trick.completed && styles.trickRowDone]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.trickTitle}>{trick.title}</Text>
        <Text style={styles.muted}>Level {trick.level} · {trick.discipline} · {trick.xp} XP</Text>
      </View>
      <StatusPill label={trick.completed ? (trick.manual ? 'Ručně' : 'Splněno') : 'Chybí'} tone={trick.completed ? 'success' : 'neutral'} />
    </View>
  );
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Parses "24. 4. 2026" or "24.4.2026" into "2026-04-24" for use as an id key. Returns null if unparseable. */
function parseDateToIso(value: string): string | null {
  const clean = value.replace(/\s+/g, '');
  const match = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10,5,20,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Palette.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  sheetHeader: {
    overflow: 'hidden',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.92,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  sheetName: {
    color: '#fff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  sheetSub: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  callBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Brand.purple,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.textMuted,
  },
  tabLabelActive: {
    color: Brand.purple,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    marginTop: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardTitle: {
    color: Palette.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  muted: {
    color: Palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  infoBox: {
    flexGrow: 1,
    flexBasis: 160,
    minWidth: 0,
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 3,
  },
  detailLabel: {
    color: Palette.textMuted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: Palette.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  progressBlock: {
    gap: Spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: Palette.text,
    fontSize: 13,
    fontWeight: '900',
  },
  progressMeta: {
    color: Palette.textMuted,
    fontSize: 13,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
  },
  consentPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  consentSuccess: { backgroundColor: Palette.successSoft, borderColor: 'rgba(31,179,122,0.36)' },
  consentWarning: { backgroundColor: Palette.accentSoft, borderColor: 'rgba(255,178,26,0.38)' },
  consentDanger: { backgroundColor: Palette.dangerSoft, borderColor: 'rgba(240,68,91,0.34)' },
  consentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consentTitle: {
    color: Palette.text,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  noteBox: {
    backgroundColor: Palette.cyanSoft,
    borderColor: 'rgba(20,200,255,0.30)',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
  },
  historyList: { gap: Spacing.sm },
  historyRow: {
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 2,
  },
  historyDate: {
    color: Palette.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  manualBlock: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  manualHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
  },
  searchBox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.borderStrong,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: Palette.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    paddingVertical: Spacing.md,
  },
  candidateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  candidate: {
    flexGrow: 1,
    flexBasis: 140,
    minWidth: 0,
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 3,
  },
  candidateSelected: {
    backgroundColor: Palette.cyanSoft,
    borderColor: Palette.cyan,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.primaryDark,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  disabledButton: { opacity: 0.44 },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  successText: { color: Palette.success, fontSize: 13, fontWeight: '900' },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterButton: {
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  filterButtonSelected: {
    backgroundColor: Palette.primarySoft,
    borderColor: Palette.primary,
  },
  filterText: { color: Palette.primaryDark, fontWeight: '800', fontSize: 12 },
  filterTextSelected: { color: Palette.primaryDark, fontWeight: '900', fontSize: 12 },
  trickList: { gap: Spacing.sm },
  trickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  trickRowDone: {
    backgroundColor: Palette.successSoft,
    borderColor: 'rgba(31,179,122,0.28)',
  },
  trickTitle: {
    color: Palette.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },
  attRow: {
    gap: Spacing.sm,
  },
  attField: {
    flex: 1,
  },
  locationChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  locationChip: {
    backgroundColor: Palette.surfaceAlt,
    borderColor: Palette.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  locationChipActive: {
    backgroundColor: Palette.primarySoft,
    borderColor: Palette.primary,
  },
  locationChipText: {
    color: Palette.primaryDark,
    fontWeight: '800',
    fontSize: 12,
  },
  locationChipTextActive: {
    color: Palette.primaryDark,
  },
  historyRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  attBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.primarySoft,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    flexShrink: 0,
  },
  attBadgeText: {
    color: Palette.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
});
