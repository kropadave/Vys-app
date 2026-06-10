import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CoachCard, CoachPageHeader } from '@/components/coach/coach-screen';
import { StatusPill } from '@/components/parent-card';
import { useCoachOperations } from '@/hooks/use-coach-operations';
import { useCoachSessions } from '@/hooks/use-coach-sessions';
import { useCoachWards } from '@/hooks/use-coach-wards';
import { type DigitalPassScanResult } from '@/hooks/use-digital-passes';
import { addParentAttendanceNotification } from '@/hooks/use-parent-notifications';
import { coachWards, sessionLocation, wardsForLocation, type ChildAttendanceRecord, type CoachSession, type CoachWard } from '@/lib/coach-content';
import { CoachColors } from '@/lib/coach-theme';
import { startNfcScan, type StopNfcFn } from '@/lib/nfc';
import { Radius, Spacing } from '@/lib/theme';

const AUTH_PROFILE_KEY = 'vys.authProfile';
const weekdayLabels = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const czechWeekdayIndex: Record<string, number> = {
  Neděle: 0,
  Pondělí: 1,
  Úterý: 2,
  Středa: 3,
  Čtvrtek: 4,
  Pátek: 5,
  Sobota: 6,
};

type CalendarTraining = {
  session: CoachSession;
  location: string;
  record?: ChildAttendanceRecord;
};

type TrainingCalendarDay = {
  date: Date;
  dateKey: string;
  inMonth: boolean;
  sessions: CalendarTraining[];
  status: 'empty' | 'done' | 'planned' | 'missed';
};

export default function CoachAttendance() {
  const { sessions: coachSessions, loading: sessionsLoading } = useCoachSessions();
  const { wards: liveWards } = useCoachWards();
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [manualName, setManualName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [childrenAttendanceStarted, setChildrenAttendanceStarted] = useState(false);
  const [nfcListening, setNfcListening] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [unknownChip, setUnknownChip] = useState<{ chipId: string } | null>(null);
  const [assigningWardId, setAssigningWardId] = useState<string | null>(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const stopNfcRef = useRef<StopNfcFn | null>(null);

  // Stop NFC when component unmounts
  useEffect(() => () => { stopNfcRef.current?.(); }, []);

  // Auto-select first session when sessions load
  useEffect(() => {
    if (coachSessions.length === 0) return;

    AsyncStorage.getItem(AUTH_PROFILE_KEY).then((value) => {
      if (value) {
        try {
          const parsed = JSON.parse(value) as { role?: string; coachLocation?: string };
          if (parsed.role === 'coach' && parsed.coachLocation) {
            const savedSession = coachSessions.find((session) => sessionLocation(session) === parsed.coachLocation);
            if (savedSession) {
              setSelectedSessionId(savedSession.id);
              return;
            }
          }
        } catch {
          // Invalid local draft should not block attendance.
        }
      }
      // Fall back to first session if no saved location
      if (!selectedSessionId) setSelectedSessionId(coachSessions[0].id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachSessions]);

  const openDropdown = () => {
    setLocationOpen(true);
    dropdownAnim.setValue(0);
    Animated.spring(dropdownAnim, { toValue: 1, useNativeDriver: true, tension: 220, friction: 20 }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => setLocationOpen(false));
  };
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => nearestTrainingDateKey(new Date(), []));
  const { childAttendanceRecords, addChildAttendanceEntry, scanChildNfcChip, assignNfcChipToWard, nfcChipAssignments } = useCoachOperations();
  const selectedSession = coachSessions.find((session) => session.id === selectedSessionId) ?? coachSessions[0];
  const selectedLocation = selectedSession ? sessionLocation(selectedSession) : '';
  const isTodayTraining = selectedSession ? czechWeekdayIndex[selectedSession.day] === new Date().getDay() : false;
  const calendarDays = useMemo(() => buildTrainingCalendar(calendarMonth, childAttendanceRecords, coachSessions), [calendarMonth, childAttendanceRecords, coachSessions]);
  const selectedCalendarDay = calendarDays.find((day) => day.dateKey === selectedCalendarDate) ?? calendarDays.find((day) => day.sessions.length > 0) ?? calendarDays[0];

  // Source of truth for manual lookups: real wards from Supabase, falling back to
  // the bundled demo wards only when no live data is available.
  const attendanceWards = liveWards.length > 0 ? liveWards : coachWards;

  // Live suggestions while the coach types a name — matches partial first/last
  // name so already-registered children show up even with a partial query.
  const manualSuggestions = useMemo(() => {
    const query = normalizeFullName(manualName);
    if (!query) return [];
    const matches = attendanceWards.filter((ward) => normalizeFullName(ward.name).includes(query));
    // Hide the list once the typed text exactly matches a single ward.
    if (matches.length === 1 && normalizeFullName(matches[0].name) === query) return [];
    return matches.slice(0, 6);
  }, [manualName, attendanceWards]);

  if (sessionsLoading) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.container}>
        <CoachPageHeader
          kicker="Trenér · Docházka"
          title="Docházka dětí"
          subtitle="Načítám přiřazené kroužky z databáze…"
          icon="check-square"
          metrics={[
            { label: 'Lokalit', value: '…', tone: 'blue' },
            { label: 'Svěřenců', value: String(coachWards.length), tone: 'teal' },
            { label: 'Stav', value: 'Načítám', tone: 'amber' },
          ]}
        />
      </ScrollView>
    );
  }

  if (!selectedSession) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.container}>
        <CoachPageHeader
          kicker="Trenér · Docházka"
          title="Docházka dětí"
          subtitle="Nejdřív se zapište do kroužku v sekci Rozvrh na hlavní obrazovce."
          icon="check-square"
          metrics={[
            { label: 'Lokalit', value: '0', tone: 'blue' },
            { label: 'Svěřenců', value: String(coachWards.length), tone: 'teal' },
            { label: 'Stav', value: 'Čeká', tone: 'amber' },
          ]}
        />
        <CoachCard title="Žádná lokalita">
          <Text style={styles.muted}>Zatím nemáš zapsaný žádný kroužek. Přidej se v sekci Rozvrh na hlavní obrazovce trenéra.</Text>
        </CoachCard>
      </ScrollView>
    );
  }

  const logManualChild = async () => {
    if (!childrenAttendanceStarted) {
      setMessage('Nejdřív zahaj zápis dětské docházky velkým tlačítkem.');
      return;
    }

    const trimmedName = manualName.trim();
    if (!trimmedName) {
      setMessage('Zadej jméno dítěte bez čipu.');
      return;
    }

    const ward = findWardByFullName(trimmedName, attendanceWards);

    if (!ward) {
      setMessage(`Účastník "${trimmedName}" není v seznamu svěřenců. Zadej celé jméno a příjmení přesně podle profilu dítěte.`);
      return;
    }

    const courseLocation = ward.locations.includes(selectedLocation) ? selectedLocation : ward.locations[0];
    const session = coachSessions.find((item) => sessionLocation(item) === courseLocation);

    if (!courseLocation || !session) {
      setMessage(`${ward.name} má profil bez navázané tréninkové lokality. Docházku nejde automaticky zařadit.`);
      return;
    }

    // Attendance can only be logged on the actual training day. The child's
    // course (e.g. Blansko) might not train today even though another location
    // (e.g. Vyškov) does — without this guard the child could be marked present
    // on a day their training never happened.
    if (czechWeekdayIndex[session.day] !== new Date().getDay()) {
      setMessage(`${ward.name} má trénink v kroužku ${courseLocation} jen v ${session.day.toLowerCase()}. Dnes ho nelze zapsat.`);
      return;
    }

    setSelectedSessionId(session.id);
    await addChildAttendanceEntry({ sessionId: session.id, participantName: ward.name, location: courseLocation, method: 'Ručně' });
    await addParentAttendanceNotification({ participantName: ward.name, location: courseLocation, method: 'Ručně' });
    setMessage(`${ward.name} zapsán ručně bez NFC čipu do kroužku ${courseLocation}. Rodiči odešla zpráva, že dítě dorazilo v pořádku.`);
    setManualName('');
  };

  const assignWardToUnknownChip = async (wardId: string) => {
    if (!unknownChip) return;
    setAssigningWardId(wardId);
    const ward = (liveWards.length > 0 ? liveWards : coachWards).find((w) => w.id === wardId);
    const assignment = await assignNfcChipToWard({
      chipId: unknownChip.chipId,
      wardId,
      participantName: ward?.name,
      location: selectedLocation,
    });
    if (!assignment) {
      setMessage('Přiřazení se nezdařilo. Zkus to znovu.');
      setAssigningWardId(null);
      return;
    }
    // Now that the chip is mapped, run the normal scan so the secure RPC also
    // increments participants.attendance_done and decrements the permanentka.
    // Pass the freshly created assignment so we don't read a stale closure.
    const scan = await scanChildNfcChip({ chipId: unknownChip.chipId, sessionId: selectedSession?.id, location: selectedLocation, knownAssignment: assignment });
    if (scan.status === 'already-registered') {
      setUnknownChip(null);
      setAssigningWardId(null);
      setMessage(`${assignment.participantName} už má dnes zapsanou docházku. Vstup se podruhé neodečítá.`);
      return;
    }
    if (scan.status !== 'logged') {
      // Fallback: at least record the attendance for the coach view.
      await addChildAttendanceEntry({ sessionId: selectedSession?.id, location: selectedLocation, participantName: assignment.participantName, method: 'NFC' });
    }
    await addParentAttendanceNotification({ participantName: assignment.participantName, location: selectedLocation, method: 'NFC' });
    setUnknownChip(null);
    setAssigningWardId(null);
    setMessage(`Čip přiřazen k ${assignment.participantName} a docházka zapsána. Příště se zapíše automaticky.`);
  };

  const startChildrenAttendance = () => {
    setChildrenAttendanceStarted(true);
    setMessage(`Zápis dětí zahájen pro ${selectedLocation}. Zapni NFC čtečku a děti jen přikládají čip k telefonu.`);
  };

  const scanNfc = async (chipId: string) => {
    if (!childrenAttendanceStarted) {
      setMessage('Nejdřív zahaj zápis dětské docházky velkým tlačítkem.');
      return;
    }

    const trimmedChipId = chipId.trim();
    if (!trimmedChipId) {
      setMessage('Zadej ID čipu, který se přiložil k telefonu.');
      return;
    }

    const result = await scanChildNfcChip({ chipId: trimmedChipId, sessionId: selectedSession?.id, location: selectedLocation });
    if (result.status === 'unknown') {
      setUnknownChip({ chipId: result.chipId });
      setMessage(null);
      return;
    }

    if (result.status === 'wrong-location') {
      setMessage(`${result.assignment.participantName} patří do lokality ${result.expectedLocations.join(', ')}, ne do ${selectedLocation}.`);
      return;
    }

    if (result.status === 'already-registered') {
      setMessage(`${result.assignment.participantName} už má dnes zapsanou docházku. Vstup se podruhé neodečítá.`);
      return;
    }

    if (result.status === 'pass-rejected') {
      setMessage(`${result.assignment.participantName} má čip přiřazený, ale docházka se nezapsala: ${passScanMessage(result.passResult)}`);
      return;
    }

    await addParentAttendanceNotification({ participantName: result.assignment.participantName, location: selectedLocation, method: 'NFC' });
    setMessage(`${result.assignment.participantName} automaticky zapsán přes čip ${result.chipId}. ${passScanMessage(result.passResult)} Rodiči odešla zpráva, že dítě dorazilo v pořádku.`);
  };

  const startNfcListening = async () => {
    if (!childrenAttendanceStarted) startChildrenAttendance();

    // Stop any previous session before starting a new one
    stopNfcRef.current?.();
    stopNfcRef.current = null;

    setNfcListening(true);
    setMessage('NFC čtečka se spouští…');

    const stop = await startNfcScan(
      (chipId) => { void scanNfc(chipId); },
      (msg) => {
        setNfcListening(false);
        setMessage(msg);
        stopNfcRef.current = null;
      },
    );

    stopNfcRef.current = stop;
    setMessage('NFC čtečka běží. Přiložte čip dítěte k telefonu.');
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <CoachPageHeader
        kicker="Trenér · Docházka"
        title="Docházka dětí"
        subtitle="Vyber lokalitu, zapni NFC a zapisuj děti rovnou do správného kroužku. Ruční zápis zůstává po ruce pro dítě bez čipu."
        icon="check-square"
        metrics={[
          { label: 'Lokalit', value: String(coachSessions.length), tone: 'blue' as const },
          { label: 'Svěřenců', value: String(coachWards.length), tone: 'teal' },
          { label: childrenAttendanceStarted ? 'Stav zápisu' : 'Připraveno', value: childrenAttendanceStarted ? 'Běží' : 'Čeká', tone: childrenAttendanceStarted ? 'teal' : 'amber' },
        ]}
      />

      <CoachCard title="Lokalita tréninku" subtitle="Docházka se ukládá podle vybrané lokality a konkrétního termínu.">
        <Pressable
          style={({ pressed }) => [styles.locationDropdownTrigger, locationOpen && styles.locationDropdownTriggerOpen, pressed && { opacity: 0.86 }]}
          onPress={() => locationOpen ? closeDropdown() : openDropdown()}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.locationDropdownLabel}>Vybraná lokalita</Text>
            <Text style={styles.locationDropdownValue}>{sessionLocation(selectedSession)}</Text>
            <Text style={styles.muted}>{selectedSession?.day} · {selectedSession?.time} · {selectedSession?.group}</Text>
          </View>
          <Animated.Text style={[styles.dropdownChevron, { transform: [{ rotate: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }]}>▼</Animated.Text>
        </Pressable>
        {locationOpen && (
          <Animated.View style={[styles.locationOptionsList, { opacity: dropdownAnim, transform: [{ translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
            {coachSessions.map((session: CoachSession) => {
              const selected = session.id === selectedSessionId;
              return (
                <Pressable
                  key={session.id}
                  onPress={() => {
                    setSelectedSessionId(session.id);
                    setManualName('');
                    setMessage(null);
                    setChildrenAttendanceStarted(false);
                    setNfcListening(false);
                    closeDropdown();
                  }}
                  style={({ pressed }) => [styles.locationOption, selected && styles.locationOptionSelected, pressed && { opacity: 0.82 }]}
                >
                  <View style={[styles.locationOptionDot, { backgroundColor: selected ? '#fff' : CoachColors.blue }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.locationOptionName, selected && styles.locationOptionSelectedText]}>{sessionLocation(session)}</Text>
                    <Text style={[styles.muted, selected && { color: 'rgba(255,255,255,0.65)' }]}>{session.day} · {session.time} · {session.group}</Text>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        )}
      </CoachCard>

      <CoachCard title="Docházka dětí na tréninku">
        <Text style={styles.muted}>Lokalita: {selectedLocation}</Text>
        {isTodayTraining ? (
          <>
            <Pressable style={({ pressed }) => [styles.startButton, childrenAttendanceStarted && styles.startButtonActive, pressed && { opacity: 0.86 }]} onPress={startNfcListening}>
              <Text style={styles.startButtonText}>{nfcListening ? 'NFC čtečka běží' : 'Zapnout NFC a zahájit docházku'}</Text>
              <Text style={styles.startButtonSubtext}>{nfcListening ? 'Děti jen přikládají čipy k telefonu trenéra.' : 'Po zapnutí se přiložený čip automaticky zapíše do docházky.'}</Text>
            </Pressable>
            {childrenAttendanceStarted ? (
              <Text style={styles.successText}>Docházka běží pro lokalitu {selectedLocation}.</Text>
            ) : (
              <Text style={styles.warningText}>Nejdřív zahaj dětskou docházku.</Text>
            )}
          </>
        ) : (
          <Text style={styles.warningText}>
            Zápis docházky je dostupný pouze v den tréninku ({selectedSession?.day}).
          </Text>
        )}
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {unknownChip ? (
          <UnassignedChipPanel
            chipId={unknownChip.chipId}
            location={selectedLocation}
            wards={liveWards.length > 0 ? liveWards : coachWards}
            nfcChipAssignments={nfcChipAssignments}
            assigningWardId={assigningWardId}
            onAssign={assignWardToUnknownChip}
            onDismiss={() => setUnknownChip(null)}
          />
        ) : null}
      </CoachCard>

      <CoachCard title="Ruční zápis bez čipu">
        {isTodayTraining ? (
          <>
            <Text style={styles.muted}>{childrenAttendanceStarted ? 'Zadej celé jméno a příjmení. Docházka se uloží podle kroužku dítěte.' : 'Nejdřív zahaj zápis dětské docházky. Potom se otevře ruční zápis.'}</Text>
            <TextInput
              value={manualName}
              onChangeText={setManualName}
              placeholder="Celé jméno a příjmení účastníka"
              placeholderTextColor={CoachColors.slateMuted}
              style={styles.input}
              editable={childrenAttendanceStarted}
            />
            {childrenAttendanceStarted && manualSuggestions.length > 0 && (
              <View style={styles.suggestionList}>
                {manualSuggestions.map((ward) => (
                  <Pressable
                    key={ward.id}
                    style={({ pressed }) => [styles.suggestionRow, pressed && { backgroundColor: CoachColors.panelAlt }]}
                    onPress={() => setManualName(ward.name)}
                  >
                    <Text style={styles.suggestionName}>{ward.name}</Text>
                    {ward.locations.length > 0 && (
                      <Text style={styles.suggestionMeta} numberOfLines={1}>{ward.locations[0]}</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
            <Pressable disabled={!childrenAttendanceStarted} style={({ pressed }) => [styles.secondaryButton, !childrenAttendanceStarted && styles.disabledButton, pressed && { opacity: 0.86 }]} onPress={logManualChild}>
              <Text style={[styles.secondaryButtonText, !childrenAttendanceStarted && styles.disabledButtonText]}>Zapsat ručně</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.warningText}>
            Ruční zápis je dostupný pouze v den tréninku ({selectedSession?.day}).
          </Text>
        )}
      </CoachCard>

      <CoachCard title="Kalendář tréninků a docházky" subtitle="Přehled plánovaných a proběhlých lekcí podle dnů.">
        <View style={styles.calendarHeader}>
          <Pressable style={({ pressed }) => [styles.calendarNavButton, pressed && { opacity: 0.84 }]} onPress={() => setCalendarMonth((month) => addMonths(month, -1))}>
            <Text style={styles.calendarNavText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
            <Text style={styles.calendarTitle}>{formatMonthLabel(calendarMonth)}</Text>
            <Text style={styles.muted}>Proběhlé tréninky, budoucí lekce a docházka po rozkliknutí dne.</Text>
          </View>
          <Pressable style={({ pressed }) => [styles.calendarNavButton, pressed && { opacity: 0.84 }]} onPress={() => setCalendarMonth((month) => addMonths(month, 1))}>
            <Text style={styles.calendarNavText}>›</Text>
          </Pressable>
        </View>

        <View style={styles.calendarLegend}>
          <LegendDot label="Proběhlo" color={CoachColors.teal} />
          <LegendDot label="Plán" color={CoachColors.blue} />
          <LegendDot label="Bez zápisu" color={CoachColors.amber} />
        </View>

        <View style={styles.weekdayGrid}>
          {weekdayLabels.map((weekday) => <Text key={weekday} style={styles.weekdayLabel}>{weekday}</Text>)}
        </View>
        <View style={styles.calendarGrid}>
          {calendarDays.map((day) => {
            const selected = day.dateKey === selectedCalendarDay?.dateKey;

            return (
              <Pressable
                key={day.dateKey}
                style={({ pressed }) => [
                  styles.calendarDay,
                  !day.inMonth && styles.calendarDayOutside,
                  day.status === 'done' && styles.calendarDayDone,
                  day.status === 'planned' && styles.calendarDayPlanned,
                  day.status === 'missed' && styles.calendarDayMissed,
                  selected && styles.calendarDaySelected,
                  pressed && { opacity: 0.84 },
                ]}
                onPress={() => setSelectedCalendarDate(day.dateKey)}
              >
                <Text style={[styles.calendarDayNumber, selected && styles.calendarDayNumberSelected]}>{day.date.getDate()}</Text>
                {day.sessions.length > 0 ? <View style={[styles.calendarMiniDot, day.status === 'done' && { backgroundColor: CoachColors.teal }, day.status === 'planned' && { backgroundColor: CoachColors.blue }, day.status === 'missed' && { backgroundColor: CoachColors.amber }]} /> : null}
              </Pressable>
            );
          })}
        </View>

        {selectedCalendarDay ? <CalendarDayDetail day={selectedCalendarDay} /> : null}
      </CoachCard>

    </ScrollView>
  );
}

function passScanMessage(result: DigitalPassScanResult) {
  if (result.status === 'updated') return `Na permanentce ${result.pass.title} je teď zaškrtnuto ${result.pass.usedEntries}/${result.pass.totalEntries} vstupů.`;
  if (result.status === 'already-registered') return 'Dnes už bylo zapsáno, vstup se podruhé neodečítá.';
  if (result.status === 'all-passes-used') return 'Všechny permanentky pro tuto lokalitu jsou už vyčerpané.';
  if (result.status === 'wrong-location') return 'Permanentka patří na jinou lokalitu.';
  return 'U účastníka není aktivní permanentka pro tuto lokalitu.';
}

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

function CalendarDayDetail({ day }: { day: TrainingCalendarDay }) {
  return (
    <View style={styles.calendarDetailBox}>
      <View style={styles.calendarDetailHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.calendarDetailTitle}>{formatFullDate(day.date)}</Text>
          <Text style={styles.muted}>{day.sessions.length > 0 ? `${day.sessions.length} tréninků v kalendáři` : 'Bez naplánovaného tréninku'}</Text>
        </View>
        <StatusPill label={calendarDayStatusLabel(day)} tone={calendarDayTone(day)} />
      </View>

      {day.sessions.length === 0 ? (
        <Text style={styles.warningText}>Na tento den nemá trenér žádný trénink.</Text>
      ) : (
        <View style={styles.calendarTrainingList}>
          {day.sessions.map((item) => {
            const expectedWards = wardsForLocation(item.location);
            const pastWithoutRecord = !item.record && startOfDay(day.date) < startOfDay(new Date());

            return (
              <View key={`${day.dateKey}-${item.session.id}`} style={styles.calendarTrainingCard}>
                <View style={styles.calendarDetailHeader}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.cardTitle}>{item.location}</Text>
                    <Text style={styles.muted}>{item.record ? 'Záznam docházky' : item.session.day} · {item.session.time} · {item.session.group}</Text>
                  </View>
                  <StatusPill label={item.record ? 'Proběhlo' : pastWithoutRecord ? 'Bez zápisu' : 'Naplánováno'} tone={item.record ? 'success' : pastWithoutRecord ? 'warning' : 'neutral'} />
                </View>

                {item.record ? (
                  <View style={styles.attendeeList}>
                    <Text style={styles.sectionLabel}>Kdo byl na tréninku</Text>
                    {item.record.attendees.map((attendee) => (
                      <View key={`${item.record?.id}-${attendee.name}`} style={styles.attendeeRow}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.cardTitle}>{attendee.name}</Text>
                          <Text style={styles.muted}>{attendee.time}</Text>
                        </View>
                        <StatusPill label={attendee.method} tone={attendee.method === 'NFC' ? 'success' : 'warning'} />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.attendeeList}>
                    <Text style={styles.sectionLabel}>{pastWithoutRecord ? 'Docházka chybí' : 'Očekávaní účastníci'}</Text>
                    {pastWithoutRecord ? <Text style={styles.warningText}>Trénink je v minulosti, ale není u něj uložený záznam docházky.</Text> : null}
                    {expectedWards.map((ward) => (
                      <View key={`${day.dateKey}-${item.session.id}-${ward.id}`} style={styles.attendeeRow}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.cardTitle}>{ward.name}</Text>
                          <Text style={styles.muted}>{ward.passTitle} · zbývá {ward.entriesLeft} vstupů</Text>
                        </View>
                        <StatusPill label={ward.hasNfcChip ? 'Čip' : 'Bez čipu'} tone={ward.hasNfcChip ? 'success' : 'warning'} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function buildTrainingCalendar(month: Date, childRecords: ChildAttendanceRecord[], sessions: CoachSession[]): TrainingCalendarDay[] {
  const monthStart = startOfMonth(month);
  const gridStart = startOfCalendarGrid(monthStart);
  const attendanceByDayAndLocation = new Map<string, ChildAttendanceRecord>();
  const recordsByDay = new Map<string, ChildAttendanceRecord[]>();

  for (const record of childRecords) {
    const recordDate = parseCzechDate(record.date);
    if (!recordDate) continue;
    const recordDateKey = dateKeyFromDate(recordDate);
    attendanceByDayAndLocation.set(`${recordDateKey}::${record.location}`, record);
    recordsByDay.set(recordDateKey, [...(recordsByDay.get(recordDateKey) ?? []), record]);
  }

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const dateKey = dateKeyFromDate(date);
    const scheduledSessions = sessions
      .filter((session) => czechWeekdayIndex[session.day] === date.getDay())
      .map((session) => {
        const location = sessionLocation(session);
        return {
          session,
          location,
          record: attendanceByDayAndLocation.get(`${dateKey}::${location}`),
        };
      });
    const scheduledLocations = new Set(scheduledSessions.map((item) => item.location));
    const recordedSessions = (recordsByDay.get(dateKey) ?? [])
      .filter((record) => !scheduledLocations.has(record.location))
      .map((record) => {
        const session = sessions.find((item) => sessionLocation(item) === record.location) ?? sessions[0];
        return { session, location: record.location, record };
      });
    const daySessions = [...scheduledSessions, ...recordedSessions];
    const hasRecord = daySessions.some((item) => item.record);
    const status: TrainingCalendarDay['status'] = daySessions.length === 0 ? 'empty' : hasRecord ? 'done' : startOfDay(date) < startOfDay(new Date()) ? 'missed' : 'planned';

    return {
      date,
      dateKey,
      inMonth: date.getMonth() === monthStart.getMonth(),
      sessions: daySessions,
      status,
    };
  });
}

function calendarDayStatusLabel(day: TrainingCalendarDay) {
  if (day.status === 'done') return 'Proběhlo';
  if (day.status === 'planned') return startOfDay(day.date).getTime() === startOfDay(new Date()).getTime() ? 'Dnes' : 'Naplánováno';
  if (day.status === 'missed') return 'Bez zápisu';
  return 'Volno';
}

function calendarDayTone(day: TrainingCalendarDay): 'neutral' | 'success' | 'warning' {
  if (day.status === 'done') return 'success';
  if (day.status === 'missed') return 'warning';
  return 'neutral';
}

function nearestTrainingDateKey(fromDate: Date, sessions: CoachSession[]) {
  const today = startOfDay(fromDate);
  for (let offset = 0; offset <= 14; offset += 1) {
    const date = addDays(today, offset);
    if (sessions.some((session) => czechWeekdayIndex[session.day] === date.getDay())) return dateKeyFromDate(date);
  }

  for (let offset = 1; offset <= 14; offset += 1) {
    const date = addDays(today, -offset);
    if (sessions.some((session) => czechWeekdayIndex[session.day] === date.getDay())) return dateKeyFromDate(date);
  }

  return dateKeyFromDate(today);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfCalendarGrid(date: Date) {
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return addDays(date, mondayOffset);
}

function dateKeyFromDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseCzechDate(value: string) {
  const match = value.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (!match) return null;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

type GeolocationLike = {
  getCurrentPosition: (
    onSuccess: (position: { coords: { latitude: number; longitude: number; accuracy?: number | null } }) => void,
    onError?: (error: { message?: string }) => void,
    options?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number },
  ) => void;
};

function findWardByFullName(name: string, wards: CoachWard[]) {
  const normalizedName = normalizeFullName(name);
  return wards.find((ward) => normalizeFullName(ward.name) === normalizedName);
}

function normalizeFullName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

const styles = StyleSheet.create({
  page: { backgroundColor: CoachColors.bg },
  container: { width: '100%', maxWidth: 860, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 104 },
  muted: { color: CoachColors.slateMuted, fontSize: 13, lineHeight: 19 },
  cardTitle: { color: CoachColors.slate, fontSize: 17, fontWeight: '900' },
  coachAttendanceHero: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center', backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg },
  coachActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  startButton: { backgroundColor: CoachColors.slate, borderRadius: Radius.lg, padding: Spacing.xl, gap: Spacing.xs },
  startButtonActive: { backgroundColor: CoachColors.teal, borderColor: 'rgba(31,157,114,0.34)', borderWidth: 1 },
  startButtonText: { color: '#fff', fontSize: 20, lineHeight: 26, fontWeight: '900' },
  startButtonSubtext: { color: '#fff', fontSize: 13, lineHeight: 19, fontWeight: '700', opacity: 0.88 },
  startSmallButton: { alignSelf: 'flex-start', backgroundColor: CoachColors.slate, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  startSmallButtonActive: { backgroundColor: CoachColors.teal },
  startSmallButtonText: { color: '#fff', fontWeight: '900' },
  secondaryButton: { alignSelf: 'flex-start', backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  secondaryButtonText: { color: CoachColors.slate, fontWeight: '900' },
  scanButton: { backgroundColor: CoachColors.teal, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  scanButtonText: { color: '#fff', fontWeight: '900' },
  disabledButton: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, opacity: 0.55 },
  disabledButtonText: { color: CoachColors.slateMuted },
  successText: { color: CoachColors.teal, fontSize: 13, lineHeight: 19, fontWeight: '800' },
  warningText: { color: CoachColors.amber, fontSize: 13, lineHeight: 19, fontWeight: '800' },
  message: { color: CoachColors.slate, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  locationResult: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: 2 },
  locationResultOk: { backgroundColor: CoachColors.tealSoft, borderColor: 'rgba(20,150,128,0.26)' },
  locationResultBlocked: { backgroundColor: CoachColors.amberSoft, borderColor: 'rgba(217,119,6,0.28)' },
  trainerHistoryList: { gap: Spacing.md },
  trainerHistoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center', backgroundColor: CoachColors.panelAlt, borderRadius: Radius.md, padding: Spacing.md },
  nfcPanel: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  nfcReaderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  nfcReaderIcon: { width: 74, height: 74, borderRadius: Radius.lg, borderWidth: 1, borderColor: CoachColors.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  nfcReaderIconActive: { backgroundColor: CoachColors.tealSoft, borderColor: 'rgba(20,150,128,0.26)' },
  nfcReaderIconText: { color: CoachColors.slate, fontSize: 18, fontWeight: '900' },
  nfcReaderIconTextActive: { color: CoachColors.teal },
  locationDropdownTrigger: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1.5, borderRadius: Radius.lg, padding: Spacing.lg },
  locationDropdownTriggerOpen: { borderColor: CoachColors.blue, backgroundColor: CoachColors.panel },
  locationDropdownLabel: { color: CoachColors.slateMuted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 },
  locationDropdownValue: { color: CoachColors.slate, fontSize: 17, fontWeight: '900', lineHeight: 22 },
  dropdownChevron: { color: CoachColors.blue, fontSize: 14, fontWeight: '900' },
  locationOptionsList: { borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden', marginTop: 4 },
  locationOption: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderBottomWidth: 1, borderBottomColor: CoachColors.border, backgroundColor: CoachColors.panelAlt },
  locationOptionDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  locationOptionName: { color: CoachColors.slate, fontSize: 15, fontWeight: '900', lineHeight: 20 },
  locationOptionSelected: { backgroundColor: CoachColors.slate },
  locationOptionSelectedText: { color: '#fff' },
  locationOptionCheck: { color: CoachColors.blue, fontSize: 18, fontWeight: '900' },
  selectedText: { color: CoachColors.blue, fontWeight: '900' },
  childRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  lockedRow: { opacity: 0.7 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  calendarNavButton: { width: 42, height: 42, borderRadius: Radius.pill, backgroundColor: CoachColors.slate, alignItems: 'center', justifyContent: 'center' },
  calendarNavText: { color: '#fff', fontSize: 28, lineHeight: 30, fontWeight: '900' },
  calendarTitle: { color: CoachColors.slate, fontSize: 20, fontWeight: '900', textTransform: 'capitalize' },
  calendarLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  weekdayGrid: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  weekdayLabel: { width: '14.2857%', textAlign: 'center', color: CoachColors.slateMuted, fontSize: 13, fontWeight: '900', paddingVertical: 6 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: CoachColors.border, borderRadius: Radius.lg, overflow: 'hidden' },
  calendarDay: { width: '14.2857%', minHeight: 58, backgroundColor: CoachColors.panelAlt, borderRightWidth: 1, borderBottomWidth: 1, borderColor: CoachColors.border, paddingVertical: 10, paddingHorizontal: 4, gap: 6, alignItems: 'center' },
  calendarDayOutside: { opacity: 0.42 },
  calendarDayDone: { backgroundColor: CoachColors.tealSoft },
  calendarDayPlanned: { backgroundColor: CoachColors.blueSoft },
  calendarDayMissed: { backgroundColor: CoachColors.amberSoft },
  calendarDaySelected: { backgroundColor: CoachColors.slate, borderColor: CoachColors.blue, borderWidth: 2 },
  calendarDayNumber: { color: CoachColors.slate, fontSize: 16, fontWeight: '900' },
  calendarDayNumberSelected: { color: '#fff' },
  calendarDayMeta: { color: CoachColors.slateMuted, fontSize: 10, lineHeight: 13, fontWeight: '900' },
  calendarMiniDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: CoachColors.teal },
  calendarDetailBox: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  calendarDetailHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center', justifyContent: 'space-between' },
  calendarDetailTitle: { color: CoachColors.slate, fontSize: 18, lineHeight: 24, fontWeight: '900', textTransform: 'capitalize' },
  calendarTrainingList: { gap: Spacing.md },
  calendarTrainingCard: { backgroundColor: CoachColors.panel, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.md },
  attendeeList: { gap: Spacing.sm },
  attendeeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center', borderTopWidth: 1, borderTopColor: CoachColors.border, paddingTop: Spacing.sm },
  sectionLabel: { color: CoachColors.slateMuted, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase' },
  input: { backgroundColor: CoachColors.panelAlt, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, color: CoachColors.slate, padding: Spacing.md, fontSize: 15 },
  suggestionList: { marginTop: Spacing.sm, borderColor: CoachColors.border, borderWidth: 1, borderRadius: Radius.md, backgroundColor: CoachColors.panel, overflow: 'hidden' },
  suggestionRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomColor: CoachColors.border, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
  suggestionName: { color: CoachColors.slate, fontSize: 15, fontWeight: '800' },
  suggestionMeta: { color: CoachColors.slateMuted, fontSize: 12, fontWeight: '600' },
});

// ─── Unassigned chip panel ────────────────────────────────────────────────────

function UnassignedChipPanel({
  chipId,
  location,
  wards,
  nfcChipAssignments,
  assigningWardId,
  onAssign,
  onDismiss,
}: {
  chipId: string;
  location: string;
  wards: CoachWard[];
  nfcChipAssignments: import('@/hooks/use-coach-operations').NfcChipAssignment[];
  assigningWardId: string | null;
  onAssign: (wardId: string) => void;
  onDismiss: () => void;
}) {
  // Wards at this location — show everyone so trainer can assign
  const locationNorm = location.toLowerCase().trim();
  const matchedByLocation = wards.filter(
    (ward) => ward.locations.some((l) => l.toLowerCase().trim() === locationNorm)
  );
  // Fallback: if location strings differ, show all wards so the trainer can still assign
  const candidatesAtLocation = matchedByLocation.length > 0 ? matchedByLocation : wards;

  // Hide wards that already have a chip assigned — a new chip should only be
  // offered to children who don't have one yet.
  const assignedWardIds = new Set(nfcChipAssignments.map((a) => a.wardId));
  const candidates = candidatesAtLocation.filter((ward) => !assignedWardIds.has(ward.id));

  const [search, setSearch] = useState('');
  const searchNorm = search.trim().toLowerCase();
  const filteredCandidates = searchNorm
    ? candidates.filter((ward) => ward.name.toLowerCase().includes(searchNorm))
    : candidates;

  return (
    <View style={up.wrap}>
      <View style={up.header}>
        <View style={{ flex: 1 }}>
          <Text style={up.title}>Nový čip — přiřadit účastníka</Text>
          <Text style={up.sub}>ID: {chipId}</Text>
        </View>
        <Pressable onPress={onDismiss} style={up.dismissBtn}>
          <Text style={up.dismissText}>✕</Text>
        </Pressable>
      </View>
      <Text style={up.location}>Lokalita: {location}</Text>
      {candidates.length === 0 ? (
        <Text style={up.empty}>
          Všichni svěřenci na této lokalitě už mají čip. Jakmile rodič koupí dítěti permanentku na tuto lokalitu, objeví se tady k přiřazení čipu.
        </Text>
      ) : (
        <>
          <Text style={up.hint}>Vyber dítě, ke kterému patří tento čip:</Text>
          <View style={up.searchBox}>
            <Text style={up.searchIcon}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Začni psát jméno…"
              placeholderTextColor={CoachColors.slateMuted}
              style={up.searchInput}
              autoCorrect={false}
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Text style={up.searchClear}>✕</Text>
              </Pressable>
            ) : null}
          </View>
          {filteredCandidates.length === 0 ? (
            <Text style={up.empty}>Žádné dítě neodpovídá „{search}“.</Text>
          ) : (
            filteredCandidates.map((ward) => {
              const isAssigning = assigningWardId === ward.id;
              return (
                <Pressable
                  key={ward.id}
                  style={({ pressed }) => [up.wardRow, isAssigning && up.wardRowActive, pressed && { opacity: 0.82 }]}
                  onPress={() => onAssign(ward.id)}
                  disabled={assigningWardId !== null}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={up.wardName}>{ward.name}</Text>
                    <Text style={up.wardMeta}>
                      {ward.passTitle ? `${ward.passTitle} · ${ward.entriesLeft} vstupů` : 'Bez čipu'}
                    </Text>
                  </View>
                  {isAssigning
                    ? <Text style={up.assigningText}>Přiřazuji…</Text>
                    : <Text style={up.assignBtn}>Přiřadit →</Text>}
                </Pressable>
              );
            })
          )}
        </>
      )}
    </View>
  );
}

const up = StyleSheet.create({
  wrap: { backgroundColor: CoachColors.tealSoft, borderWidth: 1.5, borderColor: CoachColors.teal, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  title: { fontSize: 15, fontWeight: '900', color: CoachColors.slate },
  sub: { fontSize: 11, fontWeight: '700', color: CoachColors.slateMuted, fontFamily: 'monospace', marginTop: 2 },
  location: { fontSize: 12, fontWeight: '700', color: CoachColors.slateMuted },
  hint: { fontSize: 13, fontWeight: '900', color: CoachColors.slate, marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: Radius.md, borderWidth: 1, borderColor: CoachColors.border, paddingHorizontal: Spacing.md, paddingVertical: 2 },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '700', color: CoachColors.slate, paddingVertical: 10 },
  searchClear: { fontSize: 13, color: CoachColors.slateMuted, fontWeight: '900' },
  empty: { fontSize: 13, fontWeight: '700', color: CoachColors.amber, lineHeight: 19 },
  wardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: '#fff', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: CoachColors.border },
  wardRowActive: { backgroundColor: CoachColors.teal, borderColor: CoachColors.teal },
  wardName: { fontSize: 15, fontWeight: '900', color: CoachColors.slate },
  wardMeta: { fontSize: 12, fontWeight: '700', color: CoachColors.slateMuted, marginTop: 2 },
  assignBtn: { fontSize: 13, fontWeight: '900', color: CoachColors.teal },
  assigningText: { fontSize: 13, fontWeight: '900', color: '#fff' },
  dismissBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: CoachColors.panelAlt, alignItems: 'center', justifyContent: 'center' },
  dismissText: { fontSize: 14, color: CoachColors.slateMuted, fontWeight: '900' },
});

