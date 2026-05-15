import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CoachCard, CoachPageHeader } from '@/components/coach/coach-screen';
import { StatusPill } from '@/components/parent-card';
import { useCoachOperations } from '@/hooks/use-coach-operations';
import { type DigitalPassScanResult } from '@/hooks/use-digital-passes';
import { addParentAttendanceNotification } from '@/hooks/use-parent-notifications';
import { coachSessions, coachWards, sessionLocation, wardsForLocation, type ChildAttendanceRecord, type CoachSession } from '@/lib/coach-content';
import { CoachColors } from '@/lib/coach-theme';
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
  const [selectedSessionId, setSelectedSessionId] = useState(coachSessions[0]?.id ?? '');
  const [manualName, setManualName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [childrenAttendanceStarted, setChildrenAttendanceStarted] = useState(false);
  const [nfcListening, setNfcListening] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const openDropdown = () => {
    setLocationOpen(true);
    dropdownAnim.setValue(0);
    Animated.spring(dropdownAnim, { toValue: 1, useNativeDriver: true, tension: 220, friction: 20 }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => setLocationOpen(false));
  };
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => nearestTrainingDateKey(new Date()));
  const { childAttendanceRecords, addChildAttendanceEntry, scanChildNfcChip } = useCoachOperations();
  const selectedSession = coachSessions.find((session) => session.id === selectedSessionId) ?? coachSessions[0];
  const selectedLocation = selectedSession ? sessionLocation(selectedSession) : '';
  const isTodayTraining = selectedSession ? czechWeekdayIndex[selectedSession.day] === new Date().getDay() : false;
  const calendarDays = useMemo(() => buildTrainingCalendar(calendarMonth, childAttendanceRecords), [calendarMonth, childAttendanceRecords]);
  const selectedCalendarDay = calendarDays.find((day) => day.dateKey === selectedCalendarDate) ?? calendarDays.find((day) => day.sessions.length > 0) ?? calendarDays[0];

  useEffect(() => {
    AsyncStorage.getItem(AUTH_PROFILE_KEY).then((value) => {
      if (!value) return;

      try {
        const parsed = JSON.parse(value) as { role?: string; coachLocation?: string };
        if (parsed.role !== 'coach' || !parsed.coachLocation) return;

        const savedSession = coachSessions.find((session) => sessionLocation(session) === parsed.coachLocation);
        if (savedSession) setSelectedSessionId(savedSession.id);
      } catch {
        // Invalid local draft should not block attendance.
      }
    });
  }, []);

  if (!selectedSession) {
    return (
      <ScrollView style={styles.page} contentContainerStyle={styles.container}>
        <CoachPageHeader
          kicker="Trenér · Docházka"
          title="Docházka dětí"
          subtitle="Po přiřazení reálné tréninkové lokality se tady zobrazí zápis docházky."
          icon="check-square"
          metrics={[
            { label: 'Lokalit', value: '0', tone: 'blue' },
            { label: 'Svěřenců', value: String(coachWards.length), tone: 'teal' },
            { label: 'Stav', value: 'Čeká', tone: 'amber' },
          ]}
        />
        <CoachCard title="Žádná lokalita">
          <Text style={styles.muted}>Trenér zatím nemá v databázi přiřazenou žádnou tréninkovou lokalitu.</Text>
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

    const ward = findWardByFullName(trimmedName);

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

    setSelectedSessionId(session.id);
    await addChildAttendanceEntry({ sessionId: session.id, participantName: ward.name, location: courseLocation, method: 'Ručně' });
    await addParentAttendanceNotification({ participantName: ward.name, location: courseLocation, method: 'Ručně' });
    setMessage(`${ward.name} zapsán ručně bez NFC čipu do kroužku ${courseLocation}. Rodiči odešla zpráva, že dítě dorazilo v pořádku.`);
    setManualName('');
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
      setMessage(`Čip ${result.chipId} ještě není přiřazený k dítěti. Docházka se nezapsala, čip je potřeba přiřadit v administraci účastníka.`);
      return;
    }

    if (result.status === 'wrong-location') {
      setMessage(`${result.assignment.participantName} patří do lokality ${result.expectedLocations.join(', ')}, ne do ${selectedLocation}.`);
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

    const ndefReader = createNfcReader();
    if (!ndefReader) {
      setNfcListening(true);
      setMessage('NFC čtečka je v prototypu připravená. Webový náhled neumí číst čipy na každém zařízení; v mobilní appce bude stačit přiložit čip k telefonu a docházka se zapíše sama.');
      return;
    }

    setNfcListening(true);
    setMessage('NFC čtečka běží. Přiložte čip dítěte k telefonu.');
    try {
      await ndefReader.scan();
      ndefReader.onreading = (event) => {
        const chipId = chipIdFromNfcEvent(event);
        if (!chipId) {
          setMessage('Čip se načetl, ale neobsahuje ID. Zkontroluj nastavení čipu v administraci.');
          return;
        }
        void scanNfc(chipId);
      };
      ndefReader.onreadingerror = () => setMessage('Čip se nepodařilo načíst. Přilož ho znovu k horní části telefonu.');
    } catch {
      setNfcListening(false);
      setMessage('NFC čtečku se nepodařilo zapnout. Zkontroluj, že má telefon NFC povolené.');
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <CoachPageHeader
        kicker="Trenér · Docházka"
        title="Docházka dětí"
        subtitle="Vyber lokalitu, zapni NFC a zapisuj děti rovnou do správného kroužku. Ruční zápis zůstává po ruce pro dítě bez čipu."
        icon="check-square"
        metrics={[
          { label: 'Lokalit', value: String(coachSessions.length), tone: 'blue' },
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
            {coachSessions.map((session) => {
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

function buildTrainingCalendar(month: Date, childRecords: ChildAttendanceRecord[]): TrainingCalendarDay[] {
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
    const scheduledSessions = coachSessions
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
        const session = coachSessions.find((item) => sessionLocation(item) === record.location) ?? coachSessions[0];
        return { session, location: record.location, record };
      });
    const sessions = [...scheduledSessions, ...recordedSessions];
    const hasRecord = sessions.some((item) => item.record);
    const status: TrainingCalendarDay['status'] = sessions.length === 0 ? 'empty' : hasRecord ? 'done' : startOfDay(date) < startOfDay(new Date()) ? 'missed' : 'planned';

    return {
      date,
      dateKey,
      inMonth: date.getMonth() === monthStart.getMonth(),
      sessions,
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

function nearestTrainingDateKey(fromDate: Date) {
  const today = startOfDay(fromDate);
  for (let offset = 0; offset <= 14; offset += 1) {
    const date = addDays(today, offset);
    if (coachSessions.some((session) => czechWeekdayIndex[session.day] === date.getDay())) return dateKeyFromDate(date);
  }

  for (let offset = 1; offset <= 14; offset += 1) {
    const date = addDays(today, -offset);
    if (coachSessions.some((session) => czechWeekdayIndex[session.day] === date.getDay())) return dateKeyFromDate(date);
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

type NfcReadingEventLike = {
  serialNumber?: string;
  message?: {
    records?: {
      data?: BufferSource;
      recordType?: string;
    }[];
  };
};

type NfcReaderLike = {
  scan: () => Promise<void>;
  onreading: ((event: NfcReadingEventLike) => void) | null;
  onreadingerror: (() => void) | null;
};

function createNfcReader(): NfcReaderLike | null {
  const Reader = (globalThis as typeof globalThis & { NDEFReader?: new () => NfcReaderLike }).NDEFReader;
  return Reader ? new Reader() : null;
}

function chipIdFromNfcEvent(event: NfcReadingEventLike) {
  const textRecord = event.message?.records?.find((record) => record.data && (record.recordType === 'text' || !record.recordType));
  if (textRecord?.data) {
    const decoded = new TextDecoder().decode(textRecord.data).replace(/^\u0002?[a-z]{2}/i, '').trim();
    if (decoded) return decoded;
  }

  return event.serialNumber?.trim() ?? '';
}

function findWardByFullName(name: string) {
  const normalizedName = normalizeFullName(name);
  return coachWards.find((ward) => normalizeFullName(ward.name) === normalizedName);
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
});
