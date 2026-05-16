import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ParentCard, StatusPill } from '@/components/parent-card';
import { WardDetailSheet } from '@/components/ward-detail-sheet';
import { useAuth } from '@/hooks/use-auth';
import { useBraceletConfirmations } from '@/hooks/use-bracelet-confirmations';
import { useCoachCamps } from '@/hooks/use-coach-camps';
import { useCoachOperations, type StoredCoachAttendanceRecord } from '@/hooks/use-coach-operations';
import { useCoachProfile } from '@/hooks/use-coach-profile';
import { useAllCoachSessions } from '@/hooks/use-coach-sessions';
import { useCoachWards } from '@/hooks/use-coach-wards';
import { needsPhysicalBracelet, sessionLocation, verifyCoachAtTrainingVenue, WORKSHOP_HOURLY_RATE, WORKSHOP_MAX_COACHES, workshopCalendar, type CoachSession, type SharedTrainingSlot, type TrainingVenueCheck, type WorkshopCity, type WorkshopSlot } from '@/lib/coach-content';
import { coachInitials } from '@/lib/course-coaches';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { Palette, Radius, Spacing } from '@/lib/theme';

const CoachColors = {
  bg: '#F6F8FB',
  panel: '#FFFFFF',
  slate: '#243044',
  slateSoft: '#EEF2F6',
  blue: '#0E8FB8',
  blueSoft: 'rgba(14,143,184,0.10)',
  teal: '#1F9D72',
  tealSoft: 'rgba(31,157,114,0.12)',
  amber: '#E89A18',
  amberSoft: 'rgba(232,154,24,0.13)',
  red: '#E2475D',
  redSoft: 'rgba(226,71,93,0.12)',
};

type SharedTrainingState = Record<string, Pick<SharedTrainingSlot, 'assignedCoachId' | 'assignedCoachName' | 'secondCoachId' | 'secondCoachName' | 'releasedBy' | 'releaseReason' | 'updatedAt'>>;

type WorkshopSessionRow = { id: string; coach_id: string };
type WorkshopProfileRow = { id: string; name: string | null };

const WORKSHOP_SESSION_PREFIX = 'coach-workshop-';

function trainingOccurrenceKey(slotId: string, keyDate: string) {
  return `${keyDate}:${slotId}`;
}

function slotForOccurrence(slot: SharedTrainingSlot, keyDate: string, state: SharedTrainingState): SharedTrainingSlot {
  return { ...slot, ...state[trainingOccurrenceKey(slot.id, keyDate)] };
}

function slotCoachCount(slot: { assignedCoachId?: string; secondCoachId?: string }): number {
  return (slot.assignedCoachId ? 1 : 0) + (slot.secondCoachId ? 1 : 0);
}
function slotStatusForCoach(slot: { assignedCoachId?: string; secondCoachId?: string }, myId: string): 'mine' | 'others' | 'partial' | 'open' {
  const n = slotCoachCount(slot);
  const iMine = slot.assignedCoachId === myId || slot.secondCoachId === myId;
  if (iMine) return 'mine';
  if (n === 0) return 'open';
  if (n === 1) return 'partial';
  return 'others';
}

const WEEK_DAY_NAMES = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const WEEK_DAY_ABBR = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const CZECH_MONTH_NAMES = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
const SEASON_START = { year: 2025, month: 9 };
const SEASON_END = { year: 2026, month: 5 };
function slotDayIndices(dayStr: string): number[] {
  return dayStr.split(/\s*\/\s*/).map((d) => WEEK_DAY_NAMES.indexOf(d.trim())).filter((i) => i >= 0);
}
function currentCzechDayIndex() {
  return (new Date().getDay() + 6) % 7;
}
function parseSessionTimeRange(time: string): { start: number; end: number } | null {
  const match = time.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, fromHour, fromMinute, toHour, toMinute] = match.map(Number);
  if (![fromHour, fromMinute, toHour, toMinute].every(Number.isFinite)) return null;
  return { start: fromHour * 60 + fromMinute, end: toHour * 60 + toMinute };
}
function workshopDurationHours(time: string) {
  const range = parseSessionTimeRange(time);
  if (!range) return 4;
  const minutes = range.end - range.start;
  return minutes > 0 ? minutes / 60 : 4;
}
function workshopDayLabel(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`);
  const labels = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
  return labels[date.getDay()] ?? 'Sobota';
}
function workshopSessionId(coachId: string, slotId: string) {
  return `${WORKSHOP_SESSION_PREFIX}${coachId}-${slotId}`;
}
function workshopSlotIdFromSession(row: WorkshopSessionRow) {
  const prefix = `${WORKSHOP_SESSION_PREFIX}${row.coach_id}-`;
  return row.id.startsWith(prefix) ? row.id.slice(prefix.length) : null;
}
function workshopWeekendKey(slot: Pick<WorkshopSlot, 'city' | 'date'>) {
  const date = new Date(`${slot.date}T12:00:00`);
  if (date.getDay() === 0) date.setDate(date.getDate() - 1);
  return `${slot.city}:${dateKey(date)}`;
}
function sameWorkshopWeekend(a: Pick<WorkshopSlot, 'city' | 'date'>, b: Pick<WorkshopSlot, 'city' | 'date'>) {
  return workshopWeekendKey(a) === workshopWeekendKey(b);
}
function formatWorkshopShortDate(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`);
  return `${date.getDate()}. ${date.getMonth() + 1}.`;
}
function formatWorkshopLongDate(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`);
  return `${workshopDayLabel(dateIso)} ${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
}
async function loadPersistedWorkshopState(): Promise<WorkshopSlot[]> {
  if (!hasSupabaseConfig || !supabase) return workshopCalendar;

  const { data: rowsData, error } = await supabase
    .from('coach_sessions')
    .select('id, coach_id')
    .like('id', `${WORKSHOP_SESSION_PREFIX}%`);

  if (error || !rowsData) return workshopCalendar;

  const rows = rowsData as WorkshopSessionRow[];
  const coachIds = Array.from(new Set(rows.map((row) => row.coach_id).filter(Boolean)));
  const nameById = new Map<string, string>();

  if (coachIds.length > 0) {
    const { data: profilesData } = await supabase
      .from('app_profiles')
      .select('id, name')
      .in('id', coachIds);

    for (const profile of (profilesData as WorkshopProfileRow[] | null) ?? []) {
      nameById.set(profile.id, profile.name ?? 'Trenér');
    }
  }

  const coachesBySlotId = new Map<string, WorkshopSlot['coaches']>();
  for (const row of rows) {
    const slotId = workshopSlotIdFromSession(row);
    if (!slotId) continue;
    const coaches = coachesBySlotId.get(slotId) ?? [];
    if (!coaches.some((coach) => coach.coachId === row.coach_id)) {
      coaches.push({ coachId: row.coach_id, coachName: nameById.get(row.coach_id) ?? 'Trenér' });
    }
    coachesBySlotId.set(slotId, coaches);
  }

  return workshopCalendar.map((slot) => {
    const persistedCoaches = coachesBySlotId.get(slot.id) ?? [];
    const coaches = [...slot.coaches];
    for (const coach of persistedCoaches) {
      if (!coaches.some((item) => item.coachId === coach.coachId)) coaches.push(coach);
    }
    return { ...slot, coaches, updatedAt: persistedCoaches.length > 0 ? 'uloženo v databázi' : slot.updatedAt };
  });
}
async function persistWorkshopSignup(slot: WorkshopSlot, coachId: string, siblingSlotIds: string[]) {
  if (!hasSupabaseConfig || !supabase) return;

  if (siblingSlotIds.length > 0) {
    await supabase
      .from('coach_sessions')
      .delete()
      .eq('coach_id', coachId)
      .in('id', siblingSlotIds.map((slotId) => workshopSessionId(coachId, slotId)));
  }

  const { error } = await supabase.from('coach_sessions').upsert({
    id: workshopSessionId(coachId, slot.id),
    coach_id: coachId,
    city: slot.city,
    venue: slot.venue,
    day: workshopDayLabel(slot.date),
    time: slot.time,
    group_name: `Workshop:${slot.id}`,
    enrolled: 0,
    present: 0,
    duration_hours: workshopDurationHours(slot.time),
    hourly_rate: WORKSHOP_HOURLY_RATE,
    latitude: null,
    longitude: null,
    check_in_radius_meters: 300,
  });

  if (error) throw error;
}
async function deleteWorkshopSignup(slot: WorkshopSlot, coachId: string) {
  if (!hasSupabaseConfig || !supabase) return;

  const { error } = await supabase
    .from('coach_sessions')
    .delete()
    .eq('id', workshopSessionId(coachId, slot.id))
    .eq('coach_id', coachId);

  if (error) throw error;
}
function sessionTimeStatus(session: CoachSession, now = new Date()) {
  const range = parseSessionTimeRange(session.time);
  if (!range) return { allowed: true, message: null };
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  if (currentMinutes >= range.start && currentMinutes <= range.end) return { allowed: true, message: null };
  return { allowed: false, message: `Docházku lze zapsat jen v čase tréninku ${session.time}.` };
}
function sessionFromSharedSlot(slot: SharedTrainingSlot): CoachSession {
  const parts = slot.place.split(' · ');
  return {
    id: slot.id,
    city: parts[0] ?? slot.place,
    venue: parts.slice(1).join(' · ') || slot.place,
    day: slot.day,
    time: slot.time,
    group: slot.group,
    enrolled: 0,
    present: 0,
  };
}
function computeEaster(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(year, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
}
function czechHolidaySet(startYear: number): Set<string> {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const y0 = startYear, y1 = startYear + 1;
  const s = new Set<string>([
    `${y0}-10-28`, `${y0}-11-17`, `${y0}-12-24`, `${y0}-12-25`, `${y0}-12-26`,
    `${y1}-01-01`, `${y1}-05-01`, `${y1}-05-08`,
  ]);
  const easter = computeEaster(y1);
  const gf = new Date(easter); gf.setDate(gf.getDate() - 2);
  const em = new Date(easter); em.setDate(em.getDate() + 1);
  s.add(fmt(gf)); s.add(fmt(em));
  return s;
}
function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstDow = (first.getDay() + 6) % 7;
  const grid: (Date | null)[][] = [];
  let row: (Date | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= last.getDate(); d++) {
    row.push(new Date(year, month, d));
    if (row.length === 7) { grid.push(row); row = []; }
  }
  if (row.length > 0) { while (row.length < 7) row.push(null); grid.push(row); }
  return grid;
}
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const HOLIDAYS = czechHolidaySet(SEASON_START.year);

export default function CoachHome() {
  const router = useRouter();
  const { session } = useAuth();
  const currentCoachId = session?.userId ?? '';
  const { confirmedIds, confirmPhysicalBracelet } = useBraceletConfirmations();
  const { coachAttendanceRecords, payoutStats, logCoachAttendance } = useCoachOperations();
  const { coach, saveCoachProfilePhoto } = useCoachProfile(currentCoachId);
  const { wards: coachWards } = useCoachWards();
  const { camps: coachCamps } = useCoachCamps(currentCoachId);
  const currentCoachName = currentCoachId ? coach.name || 'Trenér' : 'Trenér';
  const coachLevel = Math.max(1, Math.floor(coach.taughtTricksCount / 20) + 1);
  const coachXp = coach.taughtTricksCount * 25;
  const coachNextLevelXp = Math.max(500, coachLevel * 500);
  const progress = Math.min(coachXp / coachNextLevelXp, 1);
  const braceletNotifications = useMemo(() => coachWards.filter((ward) => needsPhysicalBracelet(ward, confirmedIds)).map((ward) => ({
    wardId: ward.id,
    wardName: ward.name,
    location: ward.locations[0] ?? '',
    bracelet: ward.bracelet,
    coachMessage: `${ward.name} má zaplacený kroužek a musí dostat fyzický náramek ${ward.bracelet}.`,
  })), [coachWards, confirmedIds]);
  const paymentRows = useMemo(() => buildPaymentRows(coachAttendanceRecords), [coachAttendanceRecords]);
  const payoutTotal = payoutStats.baseAmount + payoutStats.approvedBonuses;
  const averageHourlyRate = payoutStats.loggedHours > 0 ? Math.round(payoutStats.baseAmount / payoutStats.loggedHours) : payoutStats.hourlyRate;

  // payout history month navigation
  const [payoutViewYear, setPayoutViewYear] = useState(() => new Date().getFullYear());
  const [payoutViewMonth, setPayoutViewMonth] = useState(() => new Date().getMonth());
  const payoutSlideAnim = useRef(new Animated.Value(0)).current;
  const payoutFadeAnim = useRef(new Animated.Value(1)).current;
  const ymValP = (y: number, m: number) => y * 12 + m;
  const payoutCanGoPrev = ymValP(payoutViewYear, payoutViewMonth) > ymValP(SEASON_START.year, SEASON_START.month);
  const payoutCanGoNext = ymValP(payoutViewYear, payoutViewMonth) < ymValP(SEASON_END.year, SEASON_END.month);
  function animatePayoutMonth(changeFn: () => void, dir: 1 | -1) {
    Animated.parallel([
      Animated.timing(payoutFadeAnim, { toValue: 0, duration: 90, useNativeDriver: true }),
      Animated.timing(payoutSlideAnim, { toValue: dir * -24, duration: 90, useNativeDriver: true }),
    ]).start(() => {
      changeFn();
      payoutSlideAnim.setValue(dir * 24);
      Animated.parallel([
        Animated.timing(payoutFadeAnim, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(payoutSlideAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start();
    });
  }
  const prevPayoutMonth = () => {
    if (!payoutCanGoPrev) return;
    animatePayoutMonth(() => {
      if (payoutViewMonth === 0) { setPayoutViewYear((y) => y - 1); setPayoutViewMonth(11); } else setPayoutViewMonth((m) => m - 1);
    }, -1);
  };
  const nextPayoutMonth = () => {
    if (!payoutCanGoNext) return;
    animatePayoutMonth(() => {
      if (payoutViewMonth === 11) { setPayoutViewYear((y) => y + 1); setPayoutViewMonth(0); } else setPayoutViewMonth((m) => m + 1);
    }, 1);
  };
  const payoutMonthRows = useMemo(() => paymentRows.filter((r) => {
    const p = parseCzechDate(r.date);
    return p ? p.year === payoutViewYear && p.month === payoutViewMonth : false;
  }), [paymentRows, payoutViewYear, payoutViewMonth]);
  const payoutMonthBase = payoutMonthRows.reduce((sum, r) => sum + r.amount, 0);
  const payoutMonthHours = payoutMonthRows.reduce((sum, r) => sum + r.durationHours, 0);
  const payoutMonthAvgRate = payoutMonthHours > 0 ? Math.round(payoutMonthBase / payoutMonthHours) : payoutStats.hourlyRate;
  const todayCzech = WEEK_DAY_NAMES[currentCzechDayIndex()];
  const { slots: allCoachSessionSlots, refresh: refreshCoachSessionSlots } = useAllCoachSessions();
  const [sharedTrainingState, setSharedTrainingState] = useState<SharedTrainingState>({});
  const sharedTrainingSlots = allCoachSessionSlots;
  const todayKey = dateKey(new Date());
  const todaySessions = useMemo(
    () => sharedTrainingSlots
      .filter((slot) => slotDayIndices(slot.day).includes(currentCzechDayIndex()))
      .map((slot) => slotForOccurrence(slot, todayKey, sharedTrainingState))
      .filter((slot) => slot.assignedCoachId === currentCoachId || slot.secondCoachId === currentCoachId)
      .map(sessionFromSharedSlot),
    [currentCoachId, sharedTrainingSlots, sharedTrainingState, todayKey],
  );
  const openTrainingCount = sharedTrainingSlots.reduce((sum, slot) => sum + Math.max(0, 2 - slotCoachCount(slot)), 0);
  const criticalTrainingCount = sharedTrainingSlots.filter((slot) => slotCoachCount(slot) === 0).length;
  const myTrainingCount = sharedTrainingSlots.filter((slot) => slot.assignedCoachId === currentCoachId || slot.secondCoachId === currentCoachId).length;
  const [showNotifications, setShowNotifications] = useState(false);
  const [openWardId, setOpenWardId] = useState<string | null>(null);
  const panelAnim = useRef(new Animated.Value(0)).current;

  const openNotifications = () => {
    setShowNotifications(true);
    panelAnim.setValue(0);
    Animated.spring(panelAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 22 }).start();
  };

  const closeNotifications = () => {
    Animated.timing(panelAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setShowNotifications(false));
  };

  // history modal
  const [showHistory, setShowHistory] = useState(false);
  const historyAnim = useRef(new Animated.Value(0)).current;
  const [historyView, setHistoryView] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const allHistory = useMemo(() => {
    return coachAttendanceRecords
      .map((r) => ({ date: r.date, place: r.place, status: 'Zapsáno' }))
      .sort((a, b) => czechDateTime(b.date) - czechDateTime(a.date));
  }, [coachAttendanceRecords]);
  const openHistory = () => {
    setShowHistory(true);
    historyAnim.setValue(0);
    Animated.spring(historyAnim, { toValue: 1, useNativeDriver: true, tension: 180, friction: 24 }).start();
  };
  const closeHistory = () => {
    Animated.timing(historyAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShowHistory(false));
  };

  // shared calendar modal
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calViewYear, setCalViewYear] = useState(() => new Date().getFullYear());
  const [calViewMonth, setCalViewMonth] = useState(() => new Date().getMonth());
  const ymVal = (y: number, m: number) => y * 12 + m;
  const canGoPrevCal = ymVal(calViewYear, calViewMonth) > ymVal(SEASON_START.year, SEASON_START.month);
  const canGoNextCal = ymVal(calViewYear, calViewMonth) < ymVal(SEASON_END.year, SEASON_END.month);
  const goPrevCal = () => {
    if (!canGoPrevCal) return;
    setSelectedDate(null);
    if (calViewMonth === 0) { setCalViewYear((y) => y - 1); setCalViewMonth(11); } else setCalViewMonth((m) => m - 1);
  };
  const goNextCal = () => {
    if (!canGoNextCal) return;
    setSelectedDate(null);
    if (calViewMonth === 11) { setCalViewYear((y) => y + 1); setCalViewMonth(0); } else setCalViewMonth((m) => m + 1);
  };
  const calGrid = useMemo(() => getMonthGrid(calViewYear, calViewMonth), [calViewYear, calViewMonth]);

  // workshop calendar modal
  const [showWorkshop, setShowWorkshop] = useState(false);
  const workshopAnim = useRef(new Animated.Value(0)).current;
  const [wsCity, setWsCity] = useState<WorkshopCity>('Brno');
  const [wsViewYear, setWsViewYear] = useState(() => new Date().getFullYear());
  const [wsViewMonth, setWsViewMonth] = useState(() => new Date().getMonth());
  const [wsSelectedId, setWsSelectedId] = useState<string | null>(null);
  const [workshopState, setWorkshopState] = useState<WorkshopSlot[]>(workshopCalendar);
  const [wsActionMessage, setWsActionMessage] = useState('');
  const wsYmVal = (y: number, m: number) => y * 12 + m;
  const wsCanGoPrev = wsYmVal(wsViewYear, wsViewMonth) > wsYmVal(SEASON_START.year, SEASON_START.month);
  const wsCanGoNext = wsYmVal(wsViewYear, wsViewMonth) < wsYmVal(SEASON_END.year, SEASON_END.month);
  const wsPrevMonth = () => {
    if (!wsCanGoPrev) return; setWsSelectedId(null); setWsActionMessage('');
    if (wsViewMonth === 0) { setWsViewYear((y) => y - 1); setWsViewMonth(11); } else setWsViewMonth((m) => m - 1);
  };
  const wsNextMonth = () => {
    if (!wsCanGoNext) return; setWsSelectedId(null); setWsActionMessage('');
    if (wsViewMonth === 11) { setWsViewYear((y) => y + 1); setWsViewMonth(0); } else setWsViewMonth((m) => m + 1);
  };
  const wsGrid = useMemo(() => getMonthGrid(wsViewYear, wsViewMonth), [wsViewYear, wsViewMonth]);
  useEffect(() => {
    let mounted = true;
    void loadPersistedWorkshopState().then((nextState) => {
      if (mounted) setWorkshopState(nextState);
    });
    return () => { mounted = false; };
  }, []);
  const refreshWorkshopState = async () => {
    const nextState = await loadPersistedWorkshopState();
    setWorkshopState(nextState);
  };
  const openWorkshop = () => {
    void refreshWorkshopState();
    setShowWorkshop(true);
    workshopAnim.setValue(0);
    Animated.spring(workshopAnim, { toValue: 1, useNativeDriver: true, tension: 180, friction: 24 }).start();
  };
  const closeWorkshop = () => {
    Animated.timing(workshopAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setShowWorkshop(false); setWsSelectedId(null); setWsActionMessage('');
    });
  };
  const joinWorkshop = async (slot: WorkshopSlot) => {
    if (!currentCoachId) return;
    if (slot.coaches.length >= slot.maxCoaches) return;
    if (slot.coaches.some((c) => c.coachId === currentCoachId)) return;
    const siblingSlotIds = workshopState
      .filter((s) => s.id !== slot.id && sameWorkshopWeekend(s, slot) && s.coaches.some((c) => c.coachId === currentCoachId))
      .map((s) => s.id);

    setWsActionMessage('');
    setWorkshopState((prev) => prev.map((s) => {
      const shouldRemoveMine = sameWorkshopWeekend(s, slot);
      const coachesWithoutMe = shouldRemoveMine ? s.coaches.filter((c) => c.coachId !== currentCoachId) : s.coaches;
      if (s.id !== slot.id) return shouldRemoveMine ? { ...s, coaches: coachesWithoutMe, updatedAt: new Date().toLocaleDateString('cs-CZ') } : s;
      return {
        ...s,
        coaches: [...coachesWithoutMe, { coachId: currentCoachId, coachName: currentCoachName }],
        updatedAt: new Date().toLocaleDateString('cs-CZ'),
      };
    }));

    try {
      await persistWorkshopSignup(slot, currentCoachId, siblingSlotIds);
      await refreshWorkshopState();
      setWsActionMessage(`Zapsáno na ${formatWorkshopLongDate(slot.date)}.`);
    } catch {
      setWsActionMessage('Zápis se nepodařilo uložit do databáze.');
      await refreshWorkshopState();
    }
  };
  const leaveWorkshop = async (slot: WorkshopSlot) => {
    if (!currentCoachId) return;
    setWsActionMessage('');
    setWorkshopState((prev) => prev.map((s) => s.id !== slot.id ? s : {
      ...s,
      coaches: s.coaches.filter((c) => c.coachId !== currentCoachId),
      updatedAt: new Date().toLocaleDateString('cs-CZ'),
    }));

    try {
      await deleteWorkshopSignup(slot, currentCoachId);
      await refreshWorkshopState();
      setWsActionMessage(`Odhlášeno z ${formatWorkshopLongDate(slot.date)}.`);
    } catch {
      setWsActionMessage('Odhlášení se nepodařilo uložit do databáze.');
      await refreshWorkshopState();
    }
  };
  const myWorkshopSlots = workshopState.filter((s) => s.coaches.some((c) => c.coachId === currentCoachId));
  const myWorkshopCount = myWorkshopSlots.length;
  const openWorkshopCount = workshopState.filter((s) => s.coaches.length < s.maxCoaches).length;
  const openCalendar = () => {
    void refreshCoachSessionSlots();
    setShowCalendar(true);
    calendarAnim.setValue(0);
    Animated.spring(calendarAnim, { toValue: 1, useNativeDriver: true, tension: 180, friction: 24 }).start();
  };
  const closeCalendar = () => {
    Animated.timing(calendarAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setShowCalendar(false);
      setSelectedDate(null);
    });
  };

  // per-session logging state
  const [sessionStatus, setSessionStatus] = useState<Record<string, { checking: boolean; message: string | null; venueCheck: TrainingVenueCheck | null }>>({});
  const geolocationRef = useRef<typeof globalThis & { navigator?: { geolocation?: { getCurrentPosition: (...args: unknown[]) => void } } }>(globalThis as never);

  const logSessionAttendance = (session: CoachSession) => {
    const loc = sessionLocation(session);
    const sessionDays = slotDayIndices(session.day);
    if (!sessionDays.includes(currentCzechDayIndex())) {
      setSessionStatus((prev) => ({ ...prev, [session.id]: { checking: false, venueCheck: null, message: `Tento trénink je na ${session.day}, dnes je ${todayCzech}.` } }));
      return;
    }

    const timeStatus = sessionTimeStatus(session);
    if (!timeStatus.allowed) {
      setSessionStatus((prev) => ({ ...prev, [session.id]: { checking: false, venueCheck: null, message: timeStatus.message } }));
      return;
    }

    const geo = geolocationRef.current?.navigator?.geolocation;
    const sessionGps = session.latitude != null && session.longitude != null
      ? { latitude: session.latitude, longitude: session.longitude, radiusMeters: session.checkInRadiusMeters ?? 300 }
      : undefined;
    if (!geo) {
      // No GPS — allow anyway (web preview fallback)
      void logCoachAttendance(session).then((record) => {
        setSessionStatus((prev) => ({ ...prev, [session.id]: { checking: false, venueCheck: null, message: `Zapsáno: ${record.place}, ${record.durationHours} h, ${record.amount} Kč.` } }));
      });
      return;
    }
    setSessionStatus((prev) => ({ ...prev, [session.id]: { checking: true, venueCheck: null, message: 'Ověřuji místo tréninku...' } }));
    geo.getCurrentPosition(
      (position: GeolocationPosition) => {
        const check = verifyCoachAtTrainingVenue(loc, { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy }, sessionGps);
        if (!check.allowed) {
          setSessionStatus((prev) => ({ ...prev, [session.id]: { checking: false, venueCheck: check, message: `Jsi ${check.distanceMeters ?? '?'} m od tréninku (povoleno ${check.allowedRadiusMeters ?? 300} m). Přesuň se blíž ke škole.` } }));
          return;
        }
        void logCoachAttendance(session).then((record) => {
          setSessionStatus((prev) => ({ ...prev, [session.id]: { checking: false, venueCheck: check, message: `Zapsáno ✓ ${record.place}, ${record.durationHours} h, ${record.amount} Kč.` } }));
        });
      },
      (error: GeolocationPositionError) => {
        setSessionStatus((prev) => ({ ...prev, [session.id]: { checking: false, venueCheck: null, message: `GPS chyba: ${error.message}` } }));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 20000 } as PositionOptions,
    );
  };

  const handleLogCalendarAttendance = (slot: SharedTrainingSlot) => {
    logSessionAttendance(sessionFromSharedSlot(slot));
  };

  const releaseSharedTraining = (slot: SharedTrainingSlot, keyDate: string) => {
    if (!currentCoachId) return;
    const isFirst = slot.assignedCoachId === currentCoachId;
    if (!isFirst && slot.secondCoachId !== currentCoachId) return;
    const stateKey = trainingOccurrenceKey(slot.id, keyDate);
    setSharedTrainingState((current) => ({
      ...current,
      [stateKey]: {
        ...current[stateKey],
        ...(isFirst
          ? { assignedCoachId: undefined, assignedCoachName: undefined }
          : { secondCoachId: undefined, secondCoachName: undefined }),
        releasedBy: currentCoachName,
        releaseReason: `${currentCoachName} uvolnil svoje místo. Slot je volný pro zástup.`,
        updatedAt: `dnes ${new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`,
      },
    }));
    // Persist to Supabase: remove this coach's session row for this slot
    if (hasSupabaseConfig && supabase) {
      const [city, venue] = slot.place.split(' · ');
      void supabase
        .from('coach_sessions')
        .delete()
        .eq('coach_id', currentCoachId)
        .eq('city', city ?? '')
        .eq('venue', venue ?? '')
        .eq('day', slot.day)
        .eq('time', slot.time)
        .then(() => refreshCoachSessionSlots());
    }
  };

  const takeSharedTraining = (slot: SharedTrainingSlot, keyDate: string) => {
    if (!currentCoachId) return;
    const hasFirst = Boolean(slot.assignedCoachId);
    const stateKey = trainingOccurrenceKey(slot.id, keyDate);
    setSharedTrainingState((current) => ({
      ...current,
      [stateKey]: {
        ...current[stateKey],
        ...(hasFirst
          ? { secondCoachId: currentCoachId, secondCoachName: currentCoachName }
          : { assignedCoachId: currentCoachId, assignedCoachName: currentCoachName }),
        releasedBy: undefined,
        releaseReason: undefined,
        updatedAt: `převzato dnes ${new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`,
      },
    }));
    // Persist to Supabase: add a coach_sessions row for this coach and slot
    if (hasSupabaseConfig && supabase) {
      const [city, venue] = slot.place.split(' · ');
      const sessionId = `coach-session-${currentCoachId}-${slot.id}-${keyDate}`;
      void supabase
        .from('coach_sessions')
        .upsert({
          id: sessionId,
          coach_id: currentCoachId,
          city: city ?? '',
          venue: venue ?? '',
          day: slot.day,
          time: slot.time,
          group_name: slot.group,
          enrolled: 0,
          present: 0,
          duration_hours: 1,
          hourly_rate: 500,
          latitude: null,
          longitude: null,
          check_in_radius_meters: 300,
        })
        .then(() => refreshCoachSessionSlots());
    }
  };

  const pickProfilePhoto = async () => {
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.72,
      base64: true,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const uri = asset.base64 ? `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}` : asset.uri;
    await saveCoachProfilePhoto(currentCoachId, uri);
  };

  return (
    <>
    <View style={styles.root}>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => showNotifications ? closeNotifications() : openNotifications()}
              style={({ pressed }) => [styles.bellButton, pressed && { opacity: 0.7 }]}
            >
              <Feather name="bell" size={22} color={Palette.text} />
              {braceletNotifications.length > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{braceletNotifications.length}</Text>
                </View>
              )}
            </Pressable>
          ),
        }}
      />
      <Modal
        visible={showNotifications}
        transparent
        animationType="none"
        onRequestClose={closeNotifications}
      >
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeNotifications} />
        </BlurView>
        <Animated.View style={[
          styles.notifPanel,
          {
            opacity: panelAnim,
            transform: [{ translateY: panelAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          },
        ]}>
          <BlurView intensity={80} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: Radius.lg, overflow: 'hidden' }]} />
          <Text style={styles.notifPanelTitle}>Notifikace</Text>
          {braceletNotifications.length > 0 ? (
            braceletNotifications.map((item) => (
              <Pressable key={item.wardId} style={({ pressed }) => [styles.notificationRow, pressed && { opacity: 0.86 }]} onPress={() => { closeNotifications(); setOpenWardId(item.wardId); }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Předat fyzický náramek</Text>
                  <Text style={styles.muted}>{item.coachMessage}</Text>
                  <Text style={styles.muted}>{item.location}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.confirmButton, pressed && { opacity: 0.86 }]}
                  onPress={(e) => { e.stopPropagation?.(); confirmPhysicalBracelet(item.wardId); if (braceletNotifications.length <= 1) closeNotifications(); }}
                >
                  <Text style={styles.confirmButtonText}>Obdržen</Text>
                </Pressable>
              </Pressable>
            ))
          ) : (
            <Text style={styles.muted}>Žádné čekající notifikace.</Text>
          )}
        </Animated.View>
      </Modal>
      <Modal visible={showWorkshop} transparent animationType="none" onRequestClose={closeWorkshop}>
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeWorkshop} />
        </BlurView>
        <Animated.View
          style={[
            styles.calendarPanel,
            { transform: [{ translateY: workshopAnim.interpolate({ inputRange: [0, 1], outputRange: [900, 0] }) }] },
          ]}
        >
          <View style={styles.historyDragHandle} />
          <View style={styles.historyPanelHeader}>
            <View>
              <Text style={styles.historyPanelTitle}>Workshopy</Text>
              <Text style={styles.muted}>{WORKSHOP_HOURLY_RATE} Kč/h · {WORKSHOP_MAX_COACHES} volná místa</Text>
            </View>
            <Pressable onPress={closeWorkshop} style={({ pressed }) => [styles.historyCloseBtn, pressed && { opacity: 0.7 }]}>
              <Feather name="x" size={16} color={Palette.textMuted} />
            </Pressable>
          </View>
          {/* City filter */}
          <View style={styles.wsCityRow}>
            {(['Brno', 'Praha', 'Ostrava'] as const).map((city) => (
              <Pressable
                key={city}
                style={[styles.wsCityBtn, wsCity === city && styles.wsCityBtnActive]}
                onPress={() => { setWsCity(city); setWsSelectedId(null); setWsActionMessage(''); }}
              >
                <Text style={[styles.wsCityBtnText, wsCity === city && styles.wsCityBtnTextActive]}>{city}</Text>
              </Pressable>
            ))}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
            {/* Month navigation */}
            <View style={styles.calMonthNav}>
              <Pressable onPress={wsPrevMonth} style={({ pressed }) => [styles.calNavBtn, !wsCanGoPrev && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}>
                <Feather name="chevron-left" size={18} color={CoachColors.amber} />
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.calMonthTitle}>{CZECH_MONTH_NAMES[wsViewMonth]} {wsViewYear}</Text>
                <Text style={styles.muted}>říjen–červen · vyber jeden konkrétní den</Text>
              </View>
              <Pressable onPress={wsNextMonth} style={({ pressed }) => [styles.calNavBtn, !wsCanGoNext && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}>
                <Feather name="chevron-right" size={18} color={CoachColors.amber} />
              </Pressable>
            </View>

            {/* Legend */}
            <View style={styles.weekLegend}>
              <View style={styles.weekLegendItem}>
                <View style={[styles.weekLegendDot, { backgroundColor: Palette.success }]} />
                <Text style={styles.muted}>Plně obsazeno</Text>
              </View>
              <View style={styles.weekLegendItem}>
                <View style={[styles.weekLegendDot, { backgroundColor: Palette.accent }]} />
                <Text style={styles.muted}>Volná místa</Text>
              </View>
              <View style={styles.weekLegendItem}>
                <View style={[styles.weekLegendDot, { backgroundColor: CoachColors.blue }]} />
                <Text style={styles.muted}>Já jsem přihlášen</Text>
              </View>
            </View>

            {/* Day headers */}
            <View style={styles.calDayHeaderRow}>
              {WEEK_DAY_ABBR.map((abbr) => (
                <Text key={abbr} style={styles.calDayHeader}>{abbr}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            {wsGrid.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.calWeekRow}>
                {row.map((date, colIdx) => {
                  if (!date) return <View key={`e-${colIdx}`} style={styles.calDayCell} />;
                  const key = dateKey(date);
                  const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
                  const isToday = date.getTime() === todayD.getTime();
                  const isPast = date < todayD;
                  const daySlots = workshopState.filter((s) => {
                    if (s.date !== key) return false;
                    if (s.city !== wsCity) return false;
                    return true;
                  });
                  const isSelected = daySlots.some((s) => s.id === wsSelectedId);
                  return (
                    <Pressable
                      key={key}
                      style={({ pressed }) => [
                        styles.calDayCell,
                        daySlots.length > 0 && !isSelected && styles.calDayCellTraining,
                        isSelected && styles.calDayCellSelected,
                        pressed && daySlots.length > 0 && { opacity: 0.7 },
                      ]}
                      onPress={() => {
                        if (daySlots.length === 0) return;
                        const slot = daySlots[0];
                        if (wsSelectedId === slot.id && slot.date === key) {
                          setWsSelectedId(null); setWsActionMessage('');
                        } else {
                          setWsSelectedId(slot.id); setWsActionMessage('');
                        }
                      }}
                    >
                      <View style={[styles.calDayNumWrap, isToday && styles.calDayNumWrapToday]}>
                        <Text style={[styles.calDayNum, isToday && styles.calDayNumToday, isPast && !isToday && styles.calDayNumPast]}>
                          {date.getDate()}
                        </Text>
                      </View>
                      <View style={styles.calDotRow}>
                        {daySlots.map((slot) => {
                          const isMine = slot.coaches.some((c) => c.coachId === currentCoachId);
                          const dotColor = isMine ? CoachColors.blue : slot.coaches.length < slot.maxCoaches ? Palette.accent : Palette.success;
                          return <View key={slot.id} style={[styles.calSlotDot, { backgroundColor: dotColor }]} />;
                        })}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {/* Selected workshop detail */}
            {wsSelectedId ? (() => {
              const slot = workshopState.find((s) => s.id === wsSelectedId);
              if (!slot) return null;
              const isMine = slot.coaches.some((c) => c.coachId === currentCoachId);
              const isFull = slot.coaches.length >= slot.maxCoaches;
              const mySiblingSlot = workshopState.find((item) => item.id !== slot.id && sameWorkshopWeekend(item, slot) && item.coaches.some((coach) => coach.coachId === currentCoachId));
              const wsHours = workshopDurationHours(slot.time);
              return (
                <View style={styles.weekSlotDetail}>
                  <View style={styles.wsDetailCard}>
                    <View style={styles.wsDetailHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.wsDetailCity}>{slot.city}</Text>
                        <Text style={[styles.muted, { fontWeight: '900' }]}>{formatWorkshopLongDate(slot.date)}</Text>
                        <Text style={styles.cardTitle}>{slot.time}</Text>
                        <Text style={styles.muted}>{slot.venue}</Text>
                        {slot.notes ? <Text style={[styles.muted, { marginTop: 4, fontStyle: 'italic' }]}>{slot.notes}</Text> : null}
                      </View>
                      <StatusPill label={`${slot.coaches.length}/${slot.maxCoaches} trenérů`} tone={isFull ? 'success' : 'warning'} />
                    </View>
                    <View style={styles.wsCoachList}>
                      {Array.from({ length: slot.maxCoaches }).map((_, i) => {
                        const coach = slot.coaches[i];
                        const isMe = coach?.coachId === currentCoachId;
                        return (
                          <View key={i} style={[styles.wsCoachSlot, coach && isMe && styles.wsCoachSlotMine, coach && !isMe && styles.wsCoachSlotOther, !coach && styles.wsCoachSlotEmpty]}>
                            <Text style={[styles.muted, { fontSize: 9, textTransform: 'uppercase', fontWeight: '900' }]}>{i + 1}. trenér</Text>
                            <Text style={[styles.cardTitle, { fontSize: 12, marginTop: 1 }, !coach && { color: Palette.textSubtle }]}>{coach?.coachName ?? 'Volné místo'}</Text>
                          </View>
                        );
                      })}
                    </View>
                    <View style={{ marginTop: Spacing.sm, gap: Spacing.xs }}>
                      {!isMine && !isFull && (
                        <Pressable
                          style={({ pressed }) => [styles.wsActionBtn, styles.wsActionBtnPrimary, pressed && { opacity: 0.86 }]}
                          onPress={() => void joinWorkshop(slot)}
                        >
                          <Feather name="plus-circle" size={16} color="#fff" />
                          <Text style={styles.wsActionBtnText}>{mySiblingSlot ? 'Přepsat na tento den' : 'Zapsat se na workshop'}</Text>
                        </Pressable>
                      )}
                      {isMine && (
                        <Pressable
                          style={({ pressed }) => [styles.wsActionBtn, styles.wsActionBtnDanger, pressed && { opacity: 0.86 }]}
                          onPress={() => void leaveWorkshop(slot)}
                        >
                          <Feather name="x-circle" size={16} color={Palette.danger} />
                          <Text style={[styles.wsActionBtnText, { color: Palette.danger }]}>Odhlásit se</Text>
                        </Pressable>
                      )}
                      {isMine && (
                        <Text style={[styles.muted, { textAlign: 'center', fontSize: 11 }]}>
                          Odměna: {wsHours} h × {WORKSHOP_HOURLY_RATE} Kč/h = {wsHours * WORKSHOP_HOURLY_RATE} Kč
                        </Text>
                      )}
                      {wsActionMessage ? <Text style={[styles.muted, { textAlign: 'center', fontSize: 11 }]}>{wsActionMessage}</Text> : null}
                    </View>
                  </View>
                </View>
              );
            })() : (
              <Text style={[styles.muted, { textAlign: 'center', marginTop: Spacing.lg }]}>Klepni na datum pro zobrazení workshopu.</Text>
            )}

            {myWorkshopSlots.length > 0 && (
              <View style={[styles.myWorkshopsSection, { marginHorizontal: 16 }]}>
                <Text style={styles.myWorkshopsSectionTitle}>Moje zapsané</Text>
                <View style={styles.myWorkshopsGrid}>
                  {myWorkshopSlots.map((s) => {
                    return (
                      <View key={s.id} style={styles.myWorkshopCard}>
                        <Text style={styles.myWorkshopCardDate}>{formatWorkshopShortDate(s.date)}</Text>
                        <Text style={styles.myWorkshopCardCity}>{s.city}</Text>
                        <Text style={styles.myWorkshopCardVenue} numberOfLines={2}>{s.venue}</Text>
                        <Text style={styles.myWorkshopTime}>{s.time}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Modal>

      <Modal visible={showCalendar} transparent animationType="none" onRequestClose={closeCalendar}>
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCalendar} />
        </BlurView>
        <Animated.View
          style={[
            styles.calendarPanel,
            { transform: [{ translateY: calendarAnim.interpolate({ inputRange: [0, 1], outputRange: [900, 0] }) }] },
          ]}
        >
          <View style={styles.historyDragHandle} />
          <View style={styles.historyPanelHeader}>
            <Text style={styles.historyPanelTitle}>Kalendář tréninků</Text>
            <Pressable onPress={closeCalendar} style={({ pressed }) => [styles.historyCloseBtn, pressed && { opacity: 0.7 }]}>
              <Feather name="x" size={16} color={Palette.textMuted} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
            {/* Month navigation */}
            <View style={styles.calMonthNav}>
              <Pressable
                onPress={goPrevCal}
                style={({ pressed }) => [styles.calNavBtn, !canGoPrevCal && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}
              >
                <Feather name="chevron-left" size={18} color={CoachColors.blue} />
              </Pressable>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.calMonthTitle}>{CZECH_MONTH_NAMES[calViewMonth]} {calViewYear}</Text>
                <Text style={styles.muted}>říjen–červen · svátek = volno</Text>
              </View>
              <Pressable
                onPress={goNextCal}
                style={({ pressed }) => [styles.calNavBtn, !canGoNextCal && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}
              >
                <Feather name="chevron-right" size={18} color={CoachColors.blue} />
              </Pressable>
            </View>

            {/* Legend */}
            <View style={styles.weekLegend}>
              <View style={styles.weekLegendItem}>
                <View style={[styles.weekLegendDot, { backgroundColor: CoachColors.blue }]} />
                <Text style={styles.muted}>Moje</Text>
              </View>
              <View style={styles.weekLegendItem}>
                <View style={[styles.weekLegendDot, { backgroundColor: Palette.success }]} />
                <Text style={styles.muted}>Jiní</Text>
              </View>
              <View style={styles.weekLegendItem}>
                <View style={[styles.weekLegendDot, { backgroundColor: Palette.accent }]} />
                <Text style={styles.muted}>Volné místo</Text>
              </View>
              <View style={styles.weekLegendItem}>
                <View style={[styles.weekLegendDot, { backgroundColor: Palette.danger }]} />
                <Text style={styles.muted}>Kritické</Text>
              </View>
            </View>

            {/* Day-of-week headers */}
            <View style={styles.calDayHeaderRow}>
              {WEEK_DAY_ABBR.map((abbr) => (
                <Text key={abbr} style={styles.calDayHeader}>{abbr}</Text>
              ))}
            </View>

            {/* Calendar grid */}
            {calGrid.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.calWeekRow}>
                {row.map((date, colIdx) => {
                  if (!date) return <View key={`e-${colIdx}`} style={styles.calDayCell} />;
                  const key = dateKey(date);
                  const isHoliday = HOLIDAYS.has(key);
                  const czechIdx = (date.getDay() + 6) % 7;
                  const daySlots = isHoliday
                    ? []
                    : sharedTrainingSlots
                      .filter((slot) => slotDayIndices(slot.day).includes(czechIdx))
                      .map((slot) => slotForOccurrence(slot, key, sharedTrainingState));
                  const hasMine = daySlots.some((s) => s.assignedCoachId === currentCoachId || s.secondCoachId === currentCoachId);
                  const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
                  const isToday = date.getTime() === todayD.getTime();
                  const isPast = date < todayD;
                  const isSelected = key === selectedDate;
                  return (
                    <Pressable
                      key={key}
                      style={({ pressed }) => [
                        styles.calDayCell,
                        isHoliday && styles.calDayCellHoliday,
                        hasMine && !isSelected && styles.calDayCellMine,
                        isSelected && styles.calDayCellSelected,
                        daySlots.length > 0 && !hasMine && !isSelected && styles.calDayCellTraining,
                        pressed && daySlots.length > 0 && { opacity: 0.7 },
                      ]}
                      onPress={() => {
                        if (daySlots.length === 0) return;
                        setSelectedDate(isSelected ? null : key);
                      }}
                    >
                      <View style={[styles.calDayNumWrap, isToday && styles.calDayNumWrapToday]}>
                        <Text style={[
                          styles.calDayNum,
                          isToday && styles.calDayNumToday,
                          isPast && !isToday && styles.calDayNumPast,
                          isHoliday && styles.calDayNumHoliday,
                        ]}>
                          {date.getDate()}
                        </Text>
                      </View>
                      {isHoliday && <View style={styles.calHolidayLine} />}
                      <View style={styles.calDotRow}>
                        {daySlots.map((slot) => {
                          const wasReleasedByMe = slot.releasedBy === currentCoachName;
                          const status = slotStatusForCoach(slot, currentCoachId);
                          const dotColor = wasReleasedByMe ? 'transparent'
                            : status === 'mine' ? CoachColors.blue
                            : status === 'others' ? Palette.success
                            : status === 'partial' ? Palette.accent
                            : status === 'open' ? Palette.danger
                            : Palette.success;
                          return <View key={slot.id} style={[styles.calSlotDot, { backgroundColor: dotColor, borderWidth: wasReleasedByMe ? 1.5 : 0, borderColor: Palette.danger }]} />;
                        })}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {/* Selected slot detail */}
            {selectedDate ? (() => {
              const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
              const selDate = new Date(selectedDate);
              const czechIdx = (selDate.getDay() + 6) % 7;
              const daySlots = HOLIDAYS.has(selectedDate)
                ? []
                : sharedTrainingSlots
                  .filter((slot) => slotDayIndices(slot.day).includes(czechIdx))
                  .map((slot) => slotForOccurrence(slot, selectedDate, sharedTrainingState));
              if (daySlots.length === 0) return null;
              const todayKey = dateKey(new Date());
              const todayLabel = new Date().toLocaleDateString('cs-CZ');
              const isTodaySelected = selectedDate === todayKey;
              return (
                <View style={styles.weekSlotDetail}>
                  {daySlots.length > 1 && (
                    <Text style={[styles.muted, { marginBottom: Spacing.sm, fontWeight: '700' }]}>
                      {daySlots.length} tréninky v tento den – vyber, za který chceš zaskočit:
                    </Text>
                  )}
                  {daySlots.map((slot) => (
                    <View key={slot.id} style={{ marginBottom: daySlots.length > 1 ? Spacing.sm : 0 }}>
                      <SharedTrainingCard
                        slot={slot}
                        currentCoachId={currentCoachId}
                        currentCoachName={currentCoachName}
                        onRelease={() => releaseSharedTraining(slot, selectedDate)}
                        onTake={() => takeSharedTraining(slot, selectedDate)}
                        isToday={isTodaySelected}
                        onLogAttendance={() => handleLogCalendarAttendance(slot)}
                        attendanceLogged={coachAttendanceRecords.some((r) => r.date === todayLabel && r.place === slot.place)}
                      />
                    </View>
                  ))}
                </View>
              );
            })() : (
              <Text style={[styles.muted, { textAlign: 'center', marginTop: Spacing.lg }]}>Klepni na trénink pro zobrazení detailu.</Text>
            )}
          </ScrollView>
        </Animated.View>
      </Modal>
      <Modal visible={showHistory} transparent animationType="none" onRequestClose={closeHistory}>
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeHistory} />
        </BlurView>
        <Animated.View
          style={[
            styles.historyPanel,
            { transform: [{ translateY: historyAnim.interpolate({ inputRange: [0, 1], outputRange: [900, 0] }) }] },
          ]}
        >
          <View style={styles.historyDragHandle} />
          <View style={styles.historyPanelHeader}>
            <Text style={styles.historyPanelTitle}>Docházka trenéra</Text>
            <Pressable onPress={closeHistory} style={({ pressed }) => [styles.historyCloseBtn, pressed && { opacity: 0.7 }]}>
              <Feather name="x" size={16} color={Palette.textMuted} />
            </Pressable>
          </View>
          <View style={styles.historyTabRow}>
            <Pressable
              style={[styles.historyTab, historyView === 'list' && styles.historyTabActive]}
              onPress={() => setHistoryView('list')}
            >
              <Feather name="list" size={14} color={historyView === 'list' ? '#fff' : Palette.textMuted} />
              <Text style={[styles.historyTabText, historyView === 'list' && styles.historyTabTextActive]}>Seznam</Text>
            </Pressable>
            <Pressable
              style={[styles.historyTab, historyView === 'calendar' && styles.historyTabActive]}
              onPress={() => setHistoryView('calendar')}
            >
              <Feather name="calendar" size={14} color={historyView === 'calendar' ? '#fff' : Palette.textMuted} />
              <Text style={[styles.historyTabText, historyView === 'calendar' && styles.historyTabTextActive]}>Kalendář</Text>
            </Pressable>
          </View>
          {historyView === 'list' ? (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: Spacing.md, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
              {allHistory.length === 0 ? (
                <Text style={styles.muted}>Zatím není žádná zapsaná docházka.</Text>
              ) : (
                groupByMonthLabel(allHistory, (e) => e.date).map(({ label, items }) => (
                  <View key={label}>
                    <Text style={styles.monthGroupLabel}>{label}</Text>
                    {items.map((entry, idx) => (
                      <View key={`${entry.date}-${idx}`} style={styles.historyListRow}>
                        <View style={styles.historyListDot} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}>{entry.place}</Text>
                          <Text style={styles.muted}>{entry.date}</Text>
                        </View>
                        <StatusPill label={entry.status} tone="success" />
                      </View>
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
          ) : (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
              <HistoryCalendar
                records={allHistory}
                month={calendarMonth}
                onMonthChange={(delta) =>
                  setCalendarMonth((prev) => {
                    let m = prev.month + delta;
                    let y = prev.year;
                    if (m > 11) { m = 0; y++; }
                    if (m < 0) { m = 11; y--; }
                    return { year: y, month: m };
                  })
                }
              />
            </ScrollView>
          )}
        </Animated.View>
      </Modal>
      <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <CoachDashboardHeader
        name={currentCoachName}
        todayCount={todaySessions.length}
        missingCoaches={openTrainingCount}
        payoutTotal={payoutTotal}
        avatarUri={coach.profilePhotoUri ?? undefined}
        avatarInitials={coachInitials(currentCoachName)}
        onAvatarPress={pickProfilePhoto}
      />

      <ParentCard title="Můj progres">
        <View style={styles.levelRow}>
          <View style={styles.levelBadgeCompact}>
            <Text style={styles.level}>{coachLevel}</Text>
            <Text style={styles.levelCaption}>Level</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.cardTitle}>{coachXp} XP</Text>
            <Text style={styles.muted}>Týmový progres a cesta odměn</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.muted}>{Math.max(0, coachNextLevelXp - coachXp)} XP do dalšího levelu</Text>
      </ParentCard>

      <ParentCard title="Dnešní tréninky">
        {todaySessions.length === 0 ? (
          <Text style={styles.muted}>Dnes nemáš žádné tréninky.</Text>
        ) : (
          todaySessions.map((session) => {
            const loc = sessionLocation(session);
            const status = sessionStatus[session.id];
            const todayRecord = coachAttendanceRecords.find((r) => r.place === loc && r.date === new Date().toLocaleDateString('cs-CZ'));
            return (
              <View key={session.id} style={styles.sessionBlock}>
                <View style={styles.sessionRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{loc}</Text>
                    <Text style={styles.muted}>{session.day} · {session.time} · {session.group}</Text>
                  </View>
                </View>
                {todayRecord ? (
                  <Text style={styles.successText}>✓ Docházka dnes zapsána</Text>
                ) : (
                  <Pressable
                    disabled={status?.checking}
                    style={({ pressed }) => [styles.attendanceButton, status?.checking && styles.attendanceButtonDisabled, pressed && { opacity: 0.86 }]}
                    onPress={() => logSessionAttendance(session)}
                  >
                    <Feather name={status?.checking ? 'loader' : 'check-circle'} size={22} color="#fff" />
                    <Text style={styles.attendanceButtonText}>{status?.checking ? 'Ověřuji místo...' : 'Zapsat docházku trenéra'}</Text>
                  </Pressable>
                )}
                {status?.message ? (
                  <Text style={[styles.muted, status.venueCheck?.allowed === false ? { color: Palette.danger } : {}]}>{status.message}</Text>
                ) : null}
              </View>
            );
          })
        )}
      </ParentCard>

      {coachCamps.length > 0 && (
        <ParentCard title="Tábory">
          {coachCamps.map((camp) => (
            <View key={camp.id} style={styles.campBlock}>
              <View style={styles.campHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cardTitle}>{camp.title}</Text>
                  <Text style={styles.muted}>{camp.primaryMeta}{camp.eventDate ? ` · ${camp.eventDate}` : ''}</Text>
                </View>
                <StatusPill label={`${camp.participants.length} svěřenců`} tone="info" />
              </View>
              {camp.participants.length === 0 ? (
                <Text style={[styles.muted, { marginTop: 6 }]}>Zatím žádní přihlášení účastníci.</Text>
              ) : (
                <View style={styles.campParticipantList}>
                  {camp.participants.map((p) => (
                    <View key={p.purchaseId} style={styles.campParticipantRow}>
                      <Feather name="user" size={13} color={CoachColors.slate} />
                      <Text style={styles.campParticipantName}>{p.participantName}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ParentCard>
      )}

      <ParentCard title="Sdílený kalendář tréninků">
        <View style={[styles.sharedCalendarHero, styles.sharedCalendarHeroTraining]}>
          <View style={styles.summaryIconBox}>
            <Feather name="calendar" size={20} color={CoachColors.blue} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.sectionTitle}>Obsazení týdne</Text>
            <Text style={styles.muted}>{sharedTrainingSlots.length} tréninků · {myTrainingCount} moje</Text>
          </View>
          {criticalTrainingCount > 0 ? <StatusPill label={`${criticalTrainingCount} kritické`} tone="danger" /> : openTrainingCount > 0 ? <StatusPill label={`${openTrainingCount} volná místa`} tone="warning" /> : <StatusPill label="Vše obsazeno" tone="success" />}
        </View>
        <Pressable style={({ pressed }) => [styles.historyOpenButton, styles.calendarOpenButton, pressed && { opacity: 0.86 }]} onPress={openCalendar}>
          <Feather name="calendar" size={18} color="#fff" />
          <Text style={styles.historyOpenButtonText}>Zobrazit kalendář tréninků</Text>
        </Pressable>
      </ParentCard>

      <ParentCard title="Workshopy">
        <View style={[styles.sharedCalendarHero, styles.sharedCalendarHeroWorkshop]}>
          <View style={[styles.summaryIconBox, styles.summaryIconWorkshop]}>
            <Feather name="map-pin" size={20} color={CoachColors.amber} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.sectionTitle}>Workshopový kalendář</Text>
            <Text style={styles.muted}>Brno · Praha · Ostrava · {WORKSHOP_HOURLY_RATE} Kč/h · 4 místa</Text>
          </View>
          <View style={{ gap: 4, alignItems: 'flex-end' }}>
            {myWorkshopCount > 0 && <StatusPill label={`${myWorkshopCount} moje`} tone="success" />}
            {openWorkshopCount > 0 && <StatusPill label={`${openWorkshopCount} volné`} tone="warning" />}
          </View>
        </View>
        <Pressable style={({ pressed }) => [styles.historyOpenButton, styles.wsOpenButton, pressed && { opacity: 0.86 }]} onPress={openWorkshop}>
          <Feather name="map-pin" size={18} color="#fff" />
          <Text style={styles.historyOpenButtonText}>Zobrazit workshopy</Text>
        </Pressable>
      </ParentCard>

      <ParentCard title="Rychlé akce">
        <View style={styles.quickActions}>
          <Pressable style={({ pressed }) => [styles.quickActionButton, styles.quickActionAttendance, pressed && { opacity: 0.86 }]} onPress={() => router.push('/attendance' as never)}>
            <View style={[styles.quickActionIcon, styles.quickActionIconAttendance]}>
              <Feather name="check-square" size={18} color={CoachColors.teal} />
            </View>
            <View style={styles.quickActionCopy}>
              <Text style={styles.quickActionTitle}>Docházka dětí</Text>
              <Text style={styles.muted}>Zahájit zápis dětí, NFC a ruční příchody.</Text>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.quickActionButton, styles.quickActionQr, pressed && { opacity: 0.86 }]} onPress={() => router.push('/qr' as never)}>
            <View style={[styles.quickActionIcon, styles.quickActionIconQr]}>
              <Feather name="grid" size={18} color={CoachColors.blue} />
            </View>
            <View style={styles.quickActionCopy}>
              <Text style={styles.quickActionTitle}>QR kódy</Text>
              <Text style={styles.muted}>Generování QR pro splněné triky a skill tree.</Text>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.quickActionButton, styles.quickActionGuide, pressed && { opacity: 0.86 }]} onPress={() => router.push('/coach-inspiration' as never)}>
            <View style={[styles.quickActionIcon, styles.quickActionIconGuide]}>
              <Feather name="book-open" size={18} color={CoachColors.amber} />
            </View>
            <View style={styles.quickActionCopy}>
              <Text style={styles.quickActionTitle}>Inspirace pro trenéry</Text>
              <Text style={styles.muted}>První pomoc, metodika učení a levelování v parkouru.</Text>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.quickActionButton, styles.quickActionSpots, pressed && { opacity: 0.86 }]} onPress={() => router.push('/spots' as never)}>
            <View style={[styles.quickActionIcon, styles.quickActionIconSpots]}>
              <Feather name="map-pin" size={18} color={CoachColors.teal} />
            </View>
            <View style={styles.quickActionCopy}>
              <Text style={styles.quickActionTitle}>Trénovací spoty</Text>
              <Text style={styles.muted}>Mapa hal a venkovních spotů, recenze, přidat nové místo.</Text>
            </View>
          </Pressable>
        </View>
      </ParentCard>

      <ParentCard title="Platby a statistiky">
        <View style={styles.payoutHero}>
          <View style={styles.payoutHeroHeader}>
            <Text style={styles.payoutLabel}>Odhad výplaty za období</Text>
            <StatusPill label={payoutStats.status} tone="success" />
          </View>
          <Text style={styles.payoutValue}>{payoutTotal} Kč</Text>
          <Text style={styles.muted}>Základ {payoutStats.baseAmount} Kč + schválené bonusy {payoutStats.approvedBonuses} Kč</Text>
        </View>
        <View style={styles.statsGrid}>
          <Stat label="Základ z docházky" value={`${payoutStats.baseAmount} Kč`} />
          <Stat label="Odpracováno" value={`${payoutStats.loggedHours} h`} />
          <Stat label="Průměrná sazba" value={`${averageHourlyRate} Kč/h`} />
          <Stat label="Bonus z Cesty odměn" value={`${payoutStats.approvedBonuses} Kč`} />
          <Stat label="Další výplata" value={payoutStats.nextPayout} />
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Bonus za tento měsíc</Text>
          <View style={styles.bonusGrid}>
            <BonusRow title="Cesta odměn" description="Bonus za XP milníky dosažené tento měsíc." amount={payoutStats.approvedBonuses} tone="success" />
          </View>
        </View>

        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Historie pro výplatu</Text>
          {/* Month navigation */}
          <View style={styles.payoutMonthNav}>
            <Pressable onPress={prevPayoutMonth} style={({ pressed }) => [styles.calNavBtn, !payoutCanGoPrev && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}>
              <Feather name="chevron-left" size={18} color={CoachColors.teal} />
            </Pressable>
            <Text style={styles.calMonthTitle}>{CZECH_MONTH_NAMES[payoutViewMonth]} {payoutViewYear}</Text>
            <Pressable onPress={nextPayoutMonth} style={({ pressed }) => [styles.calNavBtn, !payoutCanGoNext && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}>
              <Feather name="chevron-right" size={18} color={CoachColors.teal} />
            </Pressable>
          </View>
          <Animated.View style={{ opacity: payoutFadeAnim, transform: [{ translateX: payoutSlideAnim }] }}>
          {/* Month summary stats */}
          {payoutMonthRows.length > 0 && (
            <View style={styles.payoutMonthSummary}>
              <View style={styles.payoutMonthStat}>
                <Text style={styles.payoutMonthStatVal}>{payoutMonthBase} Kč</Text>
                <Text style={styles.muted}>Celkem</Text>
              </View>
              <View style={styles.payoutMonthStat}>
                <Text style={styles.payoutMonthStatVal}>{payoutStats.approvedBonuses} Kč</Text>
                <Text style={styles.muted}>Bonusy</Text>
              </View>
              <View style={styles.payoutMonthStat}>
                <Text style={styles.payoutMonthStatVal}>{payoutMonthAvgRate} Kč/h</Text>
                <Text style={styles.muted}>Průměr</Text>
              </View>
              <View style={styles.payoutMonthStat}>
                <Text style={styles.payoutMonthStatVal}>{payoutMonthRows.length}</Text>
                <Text style={styles.muted}>Tréninků</Text>
              </View>
            </View>
          )}
          {payoutMonthRows.length > 0 ? (
            <View style={styles.paymentHistoryList}>
              {payoutMonthRows.map((row) => <PaymentHistoryRow key={row.id} row={row} />)}
            </View>
          ) : (
            <Text style={styles.muted}>Žádné tréninky v tomto měsíci.</Text>
          )}
          </Animated.View>
        </View>
      </ParentCard>

      <ParentCard title="Moje docházka">
        <View style={styles.historyStatsRow}>
          <View style={styles.historyStatBox}>
            <Text style={styles.historyStatVal}>{allHistory.length}</Text>
            <Text style={styles.muted}>Celkem tréninků</Text>
          </View>
          <View style={styles.historyStatBox}>
            <Text style={styles.historyStatVal}>
              {allHistory.filter((h) => {
                const p = parseCzechDate(h.date);
                if (!p) return false;
                const now = new Date();
                return p.year === now.getFullYear() && p.month === now.getMonth();
              }).length}
            </Text>
            <Text style={styles.muted}>Tento měsíc</Text>
          </View>
        </View>
        <Pressable style={({ pressed }) => [styles.historyOpenButton, pressed && { opacity: 0.86 }]} onPress={openHistory}>
          <Feather name="calendar" size={18} color="#fff" />
          <Text style={styles.historyOpenButtonText}>Zobrazit historii docházky</Text>
        </Pressable>
      </ParentCard>
    </ScrollView>
    </View>
    <WardDetailSheet wardId={openWardId} wards={coachWards} onClose={() => setOpenWardId(null)} />
    </>
  );
}

function CoachDashboardHeader({ name, todayCount, missingCoaches, payoutTotal, avatarUri, avatarInitials, onAvatarPress }: { name: string; todayCount: number; missingCoaches: number; payoutTotal: number; avatarUri?: string; avatarInitials: string; onAvatarPress: () => void }) {
  const firstName = name.split(' ')[0] ?? name;
  return (
    <View style={styles.coachHeader}>
      <View style={styles.coachHeaderTop}>
        <View style={styles.coachHeaderCopy}>
          <Text style={styles.coachHeaderKicker}>Trenérský panel</Text>
          <Text style={styles.coachHeaderTitle}>Ahoj, {firstName}</Text>
          <Text style={styles.coachHeaderBody}>Dnešní tréninky, obsazení a výplata bez zbytečného hledání.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Změnit profilovou fotku" onPress={onAvatarPress} style={({ pressed }) => [styles.coachAvatarButton, pressed && { opacity: 0.82 }]}>
          {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.coachAvatarImage} contentFit="cover" /> : <Text style={styles.coachAvatarInitials}>{avatarInitials}</Text>}
          <View style={styles.coachAvatarBadge}>
            <Feather name="camera" size={12} color="#fff" />
          </View>
        </Pressable>
      </View>
      <View style={styles.priorityGrid}>
        <PriorityStat icon="calendar" label="Dnes" value={todayCount > 0 ? `${todayCount} tréninky` : 'Volno'} tone="blue" />
        <PriorityStat icon="alert-circle" label="Volná místa" value={missingCoaches > 0 ? `${missingCoaches}` : '0'} tone={missingCoaches > 0 ? 'amber' : 'teal'} />
        <PriorityStat icon="credit-card" label="Výplata" value={`${payoutTotal} Kč`} tone="amber" />
      </View>
    </View>
  );
}

function PriorityStat({ icon, label, value, tone }: { icon: ComponentProps<typeof Feather>['name']; label: string; value: string; tone: 'blue' | 'teal' | 'amber' | 'red' }) {
  return (
    <View style={[styles.priorityCard, tone === 'blue' && styles.priorityCardBlue, tone === 'teal' && styles.priorityCardTeal, tone === 'amber' && styles.priorityCardAmber, tone === 'red' && styles.priorityCardRed]}>
      <Feather name={icon} size={16} color={toneColor(tone)} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.priorityLabel}>{label}</Text>
        <Text style={[styles.priorityValue, { color: toneColor(tone) }]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function toneColor(tone: 'blue' | 'teal' | 'amber' | 'red') {
  if (tone === 'teal') return CoachColors.teal;
  if (tone === 'amber') return CoachColors.amber;
  if (tone === 'red') return CoachColors.red;
  return CoachColors.blue;
}

function SharedTrainingCard({ slot, currentCoachId, currentCoachName, onRelease, onTake, isToday, onLogAttendance, attendanceLogged }: { slot: SharedTrainingSlot; currentCoachId: string; currentCoachName: string; onRelease: () => void; onTake: () => void; isToday?: boolean; onLogAttendance?: () => void; attendanceLogged?: boolean }) {
  const count = slotCoachCount(slot);
  const isMine = slot.assignedCoachId === currentCoachId || slot.secondCoachId === currentCoachId;
  const canTake = Boolean(currentCoachId) && count < 2 && !isMine;
  const isFullyOpen = count === 0;
  const releasedByMe = slot.releasedBy === currentCoachName;
  const openSpotLabel = count === 0 ? '2 volná místa' : '1 volné místo';
  const pillTone = isFullyOpen ? 'danger' : isMine ? (count < 2 ? 'warning' : 'success') : count < 2 ? 'warning' : 'neutral';
  const pillLabel = isFullyOpen ? `Kritické · ${openSpotLabel}` : isMine ? (count < 2 ? `Moje · ${openSpotLabel}` : 'Moje') : count < 2 ? openSpotLabel : 'Obsazeno';

  return (
    <View style={[styles.sharedTrainingCard, count < 2 && styles.sharedTrainingCardOpen, isFullyOpen && styles.sharedTrainingCardCritical]}>
      <View style={styles.sharedTrainingTop}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.sharedTrainingDay}>{slot.day} · {slot.time}</Text>
          <Text style={styles.cardTitle}>{slot.place}</Text>
          <Text style={styles.muted}>{slot.group}</Text>
        </View>
        <StatusPill label={pillLabel} tone={pillTone} />
      </View>

      <View style={styles.assignmentGrid}>
        <View style={[styles.assignmentBox, isFullyOpen && styles.assignmentBoxCritical]}>
          <Text style={styles.assignmentLabel}>1. Trenér</Text>
          <Text style={[styles.assignmentValue, !slot.assignedCoachId && { color: isFullyOpen ? Palette.danger : Palette.accent }]}>{slot.assignedCoachName ?? 'Volné místo'}</Text>
        </View>
        <View style={[styles.assignmentBox, !slot.secondCoachId && (isFullyOpen ? styles.assignmentBoxCritical : styles.assignmentBoxPartial)]}>
          <Text style={styles.assignmentLabel}>2. Trenér</Text>
          <Text style={[styles.assignmentValue, !slot.secondCoachId && { color: isFullyOpen ? Palette.danger : Palette.accent }]}>{slot.secondCoachName ?? 'Volné místo'}</Text>
        </View>
      </View>

      {isFullyOpen ? <Text style={styles.criticalTrainingText}>Kritické: na tréninku není zapsaný žádný trenér.</Text> : null}
      {slot.releaseReason ? <Text style={[styles.muted, { color: Palette.danger }]}>{slot.releaseReason}</Text> : null}
      <Text style={styles.sharedTrainingUpdated}>Aktualizace: {slot.updatedAt}</Text>

      <View style={styles.sharedTrainingActions}>
        {isMine && !releasedByMe ? (
          <Pressable style={({ pressed }) => [styles.releaseShiftButton, pressed && { opacity: 0.86 }]} onPress={onRelease}>
            <Feather name="x-circle" size={16} color={Palette.danger} />
            <Text style={styles.releaseShiftButtonText}>Nemůžu dorazit</Text>
          </Pressable>
        ) : null}
        {canTake ? (
          <Pressable style={({ pressed }) => [styles.takeShiftButton, pressed && { opacity: 0.86 }]} onPress={onTake}>
            <Feather name="user-plus" size={16} color="#fff" />
            <Text style={styles.takeShiftButtonText}>{releasedByMe ? 'Beru zpět' : 'Zapsat zástup'}</Text>
          </Pressable>
        ) : null}
        {isToday && isMine && onLogAttendance ? (
          attendanceLogged ? (
            <View style={styles.loggedBadge}>
              <Feather name="check-circle" size={14} color={Palette.success} />
              <Text style={styles.loggedBadgeText}>Docházka zapsána</Text>
            </View>
          ) : (
            <Pressable style={({ pressed }) => [styles.logAttendanceButton, pressed && { opacity: 0.8 }]} onPress={onLogAttendance}>
              <Feather name="edit-3" size={14} color={Palette.success} />
              <Text style={styles.logAttendanceButtonText}>Zapsat docházku</Text>
            </Pressable>
          )
        ) : null}
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

function BonusRow({ title, description, amount, tone }: { title: string; description: string; amount: number; tone: 'success' | 'warning' }) {
  return (
    <View style={styles.bonusCard}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.muted}>{description}</Text>
      </View>
      <StatusPill label={`${amount} Kč`} tone={tone} />
    </View>
  );
}

type PaymentRow = {
  id: string;
  date: string;
  place: string;
  durationHours: number;
  hourlyRate: number;
  amount: number;
};

function PaymentHistoryRow({ row }: { row: PaymentRow }) {
  return (
    <View style={styles.paymentRow}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.cardTitle}>{row.place}</Text>
        <Text style={styles.muted}>{row.date} · {row.durationHours} h · {row.hourlyRate} Kč/h</Text>
      </View>
      <View style={styles.paymentAmountBox}>
        <Text style={styles.paymentAmount}>{row.amount} Kč</Text>
        <Text style={styles.paymentStatus}>Započteno</Text>
      </View>
    </View>
  );
}

function buildPaymentRows(records: StoredCoachAttendanceRecord[]): PaymentRow[] {
  return [...records]
    .sort((a, b) => czechDateTime(b.date) - czechDateTime(a.date))
    .map((record) => ({
      id: record.id,
      date: record.date,
      place: record.place,
      durationHours: record.durationHours,
      hourlyRate: record.hourlyRate,
      amount: record.amount,
    }));
}

function czechDateTime(value: string) {
  const match = value.match(/(\d{1,2})\.(\s*)(\d{1,2})\.(\s*)(\d{4})/);
  if (!match) return 0;
  return new Date(Number(match[5]), Number(match[3]) - 1, Number(match[1])).getTime();
}

function groupByMonthLabel<T>(items: T[], getDate: (item: T) => string): { label: string; items: T[] }[] {
  const groups: { key: string; label: string; items: T[] }[] = [];
  for (const item of items) {
    const p = parseCzechDate(getDate(item));
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

function parseCzechDate(value: string): { year: number; month: number; day: number } | null {
  const m = value.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (!m) return null;
  return { day: Number(m[1]), month: Number(m[2]) - 1, year: Number(m[3]) };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

type HistoryEntry = { date: string; place: string; status: string };

function HistoryCalendar({ records, month, onMonthChange }: { records: HistoryEntry[]; month: { year: number; month: number }; onMonthChange: (delta: number) => void }) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const daysInMonth = getDaysInMonth(month.year, month.month);
  const firstDay = getFirstDayOfMonth(month.year, month.month);
  const monthLabel = new Date(month.year, month.month, 1).toLocaleString('cs-CZ', { month: 'long', year: 'numeric' });
  const recordsByDay = new Map<number, HistoryEntry[]>();
  for (const r of records) {
    const p = parseCzechDate(r.date);
    if (!p || p.year !== month.year || p.month !== month.month) continue;
    recordsByDay.set(p.day, [...(recordsByDay.get(p.day) ?? []), r]);
  }
  const attendedDays = new Set<number>(recordsByDay.keys());
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const selectedRecords = selectedDay !== null ? (recordsByDay.get(selectedDay) ?? []) : [];
  return (
    <View style={calStyles.container}>
      <View style={calStyles.navRow}>
        <Pressable onPress={() => { onMonthChange(-1); setSelectedDay(null); }} style={calStyles.navBtn}>
          <Feather name="chevron-left" size={20} color={Palette.text} />
        </Pressable>
        <Text style={calStyles.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={() => { onMonthChange(1); setSelectedDay(null); }} style={calStyles.navBtn}>
          <Feather name="chevron-right" size={20} color={Palette.text} />
        </Pressable>
      </View>
      <View style={calStyles.weekHeader}>
        {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((d) => (
          <Text key={d} style={calStyles.weekDay}>{d}</Text>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={calStyles.week}>
          {week.map((day, di) => {
            const attended = day !== null && attendedDays.has(day);
            const isSelected = day !== null && day === selectedDay;
            return (
              <Pressable
                key={di}
                style={({ pressed }) => [calStyles.dayCell, attended && calStyles.dayCellAttended, isSelected && calStyles.dayCellSelected, pressed && attended && { opacity: 0.75 }]}
                onPress={() => attended && day !== null ? setSelectedDay(isSelected ? null : day) : null}
              >
                {day !== null && (
                  <>
                    <Text style={[calStyles.dayNum, attended && calStyles.dayNumAttended, isSelected && calStyles.dayNumSelected]}>{day}</Text>
                    {attended && <View style={[calStyles.dot, isSelected && { backgroundColor: '#fff' }]} />}
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
      {selectedDay !== null && (
        <View style={calStyles.detailBox}>
          <Text style={calStyles.detailTitle}>{selectedDay}. {new Date(month.year, month.month, selectedDay).toLocaleString('cs-CZ', { month: 'long', year: 'numeric' })}</Text>
          {selectedRecords.length === 0 ? (
            <Text style={calStyles.detailEmpty}>Žádný záznam pro tento den.</Text>
          ) : (
            selectedRecords.map((r, idx) => (
              <View key={idx} style={calStyles.detailRow}>
                <Feather name="map-pin" size={13} color={Palette.success} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={calStyles.detailPlace}>{r.place}</Text>
                  <Text style={calStyles.detailDate}>{r.date}</Text>
                </View>
                <StatusPill label={r.status} tone="success" />
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: { gap: 4 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { color: Palette.text, fontSize: 16, fontWeight: '900' },
  weekHeader: { flexDirection: 'row', marginBottom: 4 },
  weekDay: { flex: 1, textAlign: 'center', color: Palette.textMuted, fontSize: 12, fontWeight: '700', paddingVertical: 6 },
  week: { flexDirection: 'row' },
  dayCell: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: Radius.md, margin: 1 },
  dayCellAttended: { backgroundColor: Palette.successSoft },
  dayCellSelected: { backgroundColor: Palette.success },
  dayNum: { color: Palette.text, fontSize: 14, fontWeight: '600' },
  dayNumAttended: { color: Palette.success, fontWeight: '900' },
  dayNumSelected: { color: '#fff', fontWeight: '900' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Palette.success },
  detailBox: { marginTop: Spacing.sm, backgroundColor: Palette.successSoft, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Palette.success + '33' },
  detailTitle: { color: Palette.text, fontSize: 14, fontWeight: '900', marginBottom: 2 },
  detailEmpty: { color: Palette.textMuted, fontSize: 13 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailPlace: { color: Palette.text, fontSize: 14, fontWeight: '700' },
  detailDate: { color: Palette.textMuted, fontSize: 12 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CoachColors.bg },
  page: { backgroundColor: CoachColors.bg },
  bellButton: { marginRight: 16, padding: 4, position: 'relative' },
  bellBadge: { position: 'absolute', top: 0, right: 0, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: Palette.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', lineHeight: 14 },
  notifPanel: { position: 'absolute', top: 0, right: 0, width: 320, maxWidth: '92%', backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: Radius.lg, margin: 12, padding: Spacing.lg, gap: Spacing.md, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', overflow: 'hidden' },
  notifPanelTitle: { color: Palette.text, fontSize: 16, fontWeight: '900', marginBottom: 4 },
  container: { width: '100%', maxWidth: 860, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.md, paddingBottom: 104, flexDirection: 'column' },
  coachHeader: { backgroundColor: CoachColors.panel, borderColor: 'rgba(36,48,68,0.10)', borderWidth: 1, borderRadius: Radius.xxl, padding: Spacing.lg, gap: Spacing.lg, shadowColor: '#243044', shadowOpacity: 0.12, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 4 },
  coachHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  coachHeaderCopy: { flex: 1, minWidth: 0, gap: 4 },
  coachHeaderKicker: { color: CoachColors.blue, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.1 },
  coachHeaderTitle: { color: Palette.text, fontSize: 34, lineHeight: 39, fontWeight: '900' },
  coachHeaderBody: { color: Palette.textMuted, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  coachAvatarButton: { width: 62, height: 62, borderRadius: 31, backgroundColor: CoachColors.slate, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF', shadowColor: '#243044', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  coachAvatarImage: { width: '100%', height: '100%', borderRadius: 31 },
  coachAvatarInitials: { color: '#FFFFFF', fontSize: 20, lineHeight: 24, fontWeight: '900' },
  coachAvatarBadge: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: CoachColors.blue, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  priorityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  priorityCard: { flex: 1, minWidth: 150, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md },
  priorityCardBlue: { backgroundColor: CoachColors.blueSoft, borderColor: 'rgba(14,143,184,0.22)' },
  priorityCardTeal: { backgroundColor: CoachColors.tealSoft, borderColor: 'rgba(31,157,114,0.22)' },
  priorityCardAmber: { backgroundColor: CoachColors.amberSoft, borderColor: 'rgba(232,154,24,0.24)' },
  priorityCardRed: { backgroundColor: CoachColors.redSoft, borderColor: 'rgba(226,71,93,0.24)' },
  priorityLabel: { color: Palette.textMuted, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase' },
  priorityValue: { fontSize: 16, lineHeight: 21, fontWeight: '900' },
  hero: { gap: 8 },
  kicker: { color: CoachColors.blue, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: Palette.text, fontSize: 28, fontWeight: '900' },
  body: { color: Palette.textMuted, fontSize: 15, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.lg },
  levelRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  levelBadgeCompact: { minWidth: 86, borderRadius: Radius.lg, backgroundColor: CoachColors.slateSoft, borderWidth: 1, borderColor: 'rgba(36,48,68,0.08)', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, alignItems: 'center' },
  level: { color: Palette.text, fontSize: 46, lineHeight: 50, fontWeight: '900' },
  levelCaption: { color: Palette.textMuted, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase' },
  cardTitle: { color: Palette.text, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  muted: { color: Palette.textMuted, fontSize: 13, lineHeight: 19 },
  quickActions: { gap: Spacing.sm },
  quickActionButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: '#FFFFFF', borderColor: Palette.border, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, minHeight: 74 },
  quickActionAttendance: { borderLeftWidth: 4, borderLeftColor: CoachColors.teal },
  quickActionQr: { borderLeftWidth: 4, borderLeftColor: CoachColors.blue },
  quickActionGuide: { borderLeftWidth: 4, borderLeftColor: CoachColors.amber },
  quickActionSpots: { borderLeftWidth: 4, borderLeftColor: CoachColors.teal },
  quickActionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  quickActionIconAttendance: { backgroundColor: CoachColors.tealSoft },
  quickActionIconQr: { backgroundColor: CoachColors.blueSoft },
  quickActionIconGuide: { backgroundColor: CoachColors.amberSoft },
  quickActionIconSpots: { backgroundColor: CoachColors.tealSoft },
  quickActionCopy: { flex: 1, minWidth: 0, gap: 2 },
  quickActionTitle: { color: Palette.text, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  progressTrack: { height: 10, backgroundColor: CoachColors.slateSoft, borderRadius: Radius.pill, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Palette.success, borderRadius: Radius.pill },
  notificationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center', backgroundColor: Palette.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md },

  confirmButton: { backgroundColor: Palette.success, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  confirmButtonText: { color: Palette.bg, fontWeight: '900' },
  trainingLocationList: { gap: Spacing.sm },
  trainingLocationRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.border, backgroundColor: '#fff', padding: Spacing.md },
  locationForm: { gap: Spacing.md, borderTopWidth: 1, borderTopColor: Palette.border, paddingTop: Spacing.md },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  formInput: { flexGrow: 1, flexBasis: 150, minHeight: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.border, backgroundColor: '#fff', paddingHorizontal: Spacing.md, color: Palette.text, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  dayChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  dayChip: { minWidth: 42, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Palette.border, backgroundColor: '#fff' },
  dayChipActive: { backgroundColor: CoachColors.blue, borderColor: CoachColors.blue },
  dayChipText: { color: Palette.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '900', textTransform: 'uppercase' },
  dayChipTextActive: { color: '#fff' },
  locationFormActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  secondaryButton: { flexGrow: 1, flexBasis: 170, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(14,143,184,0.22)', backgroundColor: CoachColors.blueSoft, paddingHorizontal: Spacing.md },
  secondaryButtonText: { color: CoachColors.blue, fontSize: 14, lineHeight: 19, fontWeight: '900' },
  sessionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center' },
  sessionBlock: { gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Palette.border, paddingBottom: Spacing.md },
  campBlock: { gap: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Palette.border, paddingBottom: Spacing.md },
  campHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  campParticipantList: { marginTop: 4, gap: 4 },
  campParticipantRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  campParticipantName: { color: CoachColors.slate, fontSize: 13, lineHeight: 18 },
  attendanceButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: CoachColors.teal, borderRadius: Radius.lg, paddingVertical: 16, paddingHorizontal: Spacing.lg },
  attendanceButtonDisabled: { opacity: 0.5 },
  attendanceButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  successText: { color: Palette.success, fontWeight: '900', fontSize: 13 },
  sharedCalendarHero: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center', justifyContent: 'space-between', borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md },
  sharedCalendarHeroTraining: { backgroundColor: CoachColors.blueSoft, borderColor: 'rgba(14,143,184,0.20)' },
  sharedCalendarHeroWorkshop: { backgroundColor: CoachColors.amberSoft, borderColor: 'rgba(232,154,24,0.22)' },
  summaryIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(14,143,184,0.18)' },
  summaryIconWorkshop: { borderColor: 'rgba(232,154,24,0.24)' },
  sharedCalendarStats: { flexDirection: 'row', gap: Spacing.md },
  sharedCalendarStatBox: { flex: 1, backgroundColor: Palette.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  sharedCalendarStatValue: { color: Palette.text, fontSize: 24, lineHeight: 30, fontWeight: '900' },
  sharedTrainingList: { gap: Spacing.md },
  sharedTrainingCard: { gap: Spacing.md, borderWidth: 1, borderColor: Palette.border, backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md },
  sharedTrainingCardOpen: { borderColor: 'rgba(219,160,61,0.32)', backgroundColor: 'rgba(219,160,61,0.07)' },
  sharedTrainingCardCritical: { borderColor: 'rgba(240,68,91,0.38)', backgroundColor: 'rgba(240,68,91,0.08)' },
  sharedTrainingTop: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'flex-start', justifyContent: 'space-between' },
  sharedTrainingDay: { color: CoachColors.blue, fontSize: 12, lineHeight: 17, fontWeight: '900', textTransform: 'uppercase' },
  assignmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  assignmentBox: { flex: 1, minWidth: 150, backgroundColor: Palette.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md },
  assignmentBoxOpen: { backgroundColor: Palette.accentSoft },
  assignmentBoxCritical: { backgroundColor: Palette.dangerSoft, borderWidth: 1, borderColor: 'rgba(240,68,91,0.24)' },
  assignmentLabel: { color: Palette.textMuted, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase' },
  assignmentValue: { color: Palette.text, fontSize: 15, lineHeight: 20, fontWeight: '900', marginTop: 2 },
  sharedTrainingUpdated: { color: Palette.textSubtle, fontSize: 11, lineHeight: 15, fontWeight: '800' },
  criticalTrainingText: { color: Palette.danger, fontSize: 12, lineHeight: 17, fontWeight: '900' },
  myWorkshopsSection: { borderTopWidth: 1, borderTopColor: Palette.border, paddingTop: Spacing.md, gap: Spacing.sm },
  myWorkshopsSectionTitle: { color: Palette.textMuted, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 },
  myWorkshopsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  myWorkshopCard: { flex: 1, minWidth: '45%', backgroundColor: Palette.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md, gap: 3, borderWidth: 1, borderColor: 'rgba(219,160,61,0.22)' },
  myWorkshopCardDate: { color: CoachColors.amber, fontSize: 13, lineHeight: 17, fontWeight: '900' },
  myWorkshopCardCity: { color: Palette.text, fontSize: 13, lineHeight: 17, fontWeight: '900' },
  myWorkshopCardVenue: { color: Palette.textMuted, fontSize: 11, lineHeight: 15 },
  myWorkshopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Palette.surfaceAlt },
  myWorkshopDate: { color: Palette.text, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  myWorkshopVenue: { color: Palette.textMuted, fontSize: 12, lineHeight: 16 },
  myWorkshopTime: { color: CoachColors.amber, fontSize: 12, lineHeight: 16, fontWeight: '800', marginTop: 1 },
  sharedTrainingActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  releaseShiftButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: Radius.pill, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(240,68,91,0.28)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  releaseShiftButtonText: { color: Palette.danger, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  takeShiftButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: Radius.pill, backgroundColor: Palette.success, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  takeShiftButtonText: { color: '#fff', fontSize: 13, lineHeight: 18, fontWeight: '900' },
  historyStatsRow: { flexDirection: 'row', gap: Spacing.md },
  historyStatBox: { flex: 1, backgroundColor: CoachColors.slateSoft, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  historyStatVal: { color: Palette.text, fontSize: 28, fontWeight: '900' },
  historyOpenButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: CoachColors.slate, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: Spacing.lg },
  calendarOpenButton: { backgroundColor: CoachColors.blue },
  historyOpenButtonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  historyPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '84%', backgroundColor: CoachColors.bg, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, flexDirection: 'column', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 32, shadowOffset: { width: 0, height: -4 }, elevation: 20 },
  calendarPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '88%', backgroundColor: CoachColors.bg, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, flexDirection: 'column', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 32, shadowOffset: { width: 0, height: -4 }, elevation: 20 },
  weekGrid: { flexDirection: 'row', gap: 4, marginBottom: Spacing.md },
  weekCol: { flex: 1, alignItems: 'center', gap: 6 },
  weekDayLabel: { color: CoachColors.blue, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 2 },
  weekSlotDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.successSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Palette.success },
  weekSlotDotMine: { width: 36, height: 36, borderRadius: 18, backgroundColor: CoachColors.blueSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: CoachColors.blue },
  weekSlotDotPartial: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.accentSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Palette.accent },
  weekSlotDotOpen: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.dangerSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Palette.danger },
  weekSlotDotSelected: { transform: [{ scale: 1.18 }] },
  weekSlotDotText: { color: Palette.success, fontSize: 14, fontWeight: '900' },
  weekSlotDotTextMine: { color: CoachColors.blue, fontSize: 14, fontWeight: '900' },
  weekSlotDotTextPartial: { color: Palette.accent, fontSize: 14, fontWeight: '900' },
  weekSlotDotTextOpen: { color: Palette.danger, fontSize: 14, fontWeight: '900' },
  weekSlotEmpty: { width: 36, height: 36, borderRadius: 18, backgroundColor: Palette.surfaceAlt, opacity: 0.45 },
  weekLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.md },
  weekLegendItem: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  weekLegendDot: { width: 10, height: 10, borderRadius: 5 },
  weekSlotDetail: { marginTop: Spacing.sm },
  calMonthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md, paddingHorizontal: Spacing.xs },
  calNavBtn: { width: 36, height: 36, borderRadius: Radius.md, backgroundColor: CoachColors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  calMonthTitle: { fontSize: 15, fontWeight: '900', color: CoachColors.blue, textAlign: 'center' },
  calDayHeaderRow: { flexDirection: 'row', marginBottom: 4 },
  calDayHeader: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '900', color: CoachColors.blue, textTransform: 'uppercase' },
  calWeekRow: { flexDirection: 'row', marginBottom: 2 },
  calDayCell: { flex: 1, minHeight: 44, alignItems: 'center', paddingVertical: 4, borderRadius: Radius.sm },
  calDayCellTraining: { backgroundColor: CoachColors.blueSoft },
  calDayCellMine: { backgroundColor: 'rgba(14,143,184,0.16)', borderWidth: 1, borderColor: 'rgba(14,143,184,0.25)' },
  calDayCellSelected: { backgroundColor: CoachColors.blueSoft, borderWidth: 1.5, borderColor: CoachColors.blue },
  calDayCellHoliday: { backgroundColor: 'rgba(0,0,0,0.025)' },
  logAttendanceButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: Palette.success, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, alignSelf: 'flex-start', backgroundColor: 'rgba(31,179,122,0.07)' },
  logAttendanceButtonText: { fontSize: 13, fontWeight: '700', color: Palette.success },
  loggedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.xs },
  loggedBadgeText: { fontSize: 13, fontWeight: '700', color: Palette.success },
  calDayNumWrap: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  calDayNumWrapToday: { backgroundColor: CoachColors.blue },
  calDayNum: { fontSize: 12, fontWeight: '700', color: Palette.textMuted },
  calDayNumToday: { color: '#fff', fontWeight: '900' },
  calDayNumPast: { color: Palette.textSubtle, opacity: 0.5 },
  calDayNumHoliday: { color: Palette.textSubtle, opacity: 0.4 },
  calHolidayLine: { width: 16, height: 1.5, backgroundColor: Palette.textSubtle, opacity: 0.3, marginTop: 1, borderRadius: 1 },
  calDotRow: { flexDirection: 'row', gap: 2, marginTop: 2, flexWrap: 'wrap', justifyContent: 'center' },
  calSlotDot: { width: 6, height: 6, borderRadius: 3 },
  wsCityRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md, flexWrap: 'wrap' },
  wsCityBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.pill, backgroundColor: Palette.surfaceAlt, borderWidth: 1, borderColor: Palette.border },
  wsCityBtnActive: { backgroundColor: CoachColors.amber, borderColor: CoachColors.amber },
  wsCityBtnText: { fontSize: 12, fontWeight: '700', color: Palette.textMuted },
  wsCityBtnTextActive: { color: '#fff' },
  wsOpenButton: { backgroundColor: CoachColors.amber },
  wsDetailCard: { backgroundColor: '#fff', borderRadius: Radius.lg, borderWidth: 1, borderColor: Palette.border, padding: Spacing.md, gap: Spacing.sm },
  wsDetailHeader: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  wsDetailCity: { fontSize: 16, fontWeight: '900', color: CoachColors.amber, marginBottom: 2 },
  wsCoachList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  wsCoachSlot: { flex: 1, minWidth: '45%', borderRadius: Radius.md, padding: Spacing.sm, borderWidth: 1 },
  wsCoachSlotMine: { backgroundColor: CoachColors.blueSoft, borderColor: CoachColors.blue },
  wsCoachSlotOther: { backgroundColor: Palette.successSoft, borderColor: Palette.success },
  wsCoachSlotEmpty: { backgroundColor: Palette.dangerSoft, borderColor: Palette.danger },
  wsActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderRadius: Radius.lg, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  wsActionBtnPrimary: { backgroundColor: CoachColors.teal },
  wsActionBtnDanger: { backgroundColor: Palette.dangerSoft, borderWidth: 1, borderColor: Palette.danger },
  wsActionBtnText: { fontSize: 13, fontWeight: '900', color: '#fff' },
  assignmentBoxPartial: { backgroundColor: Palette.accentSoft },
  historyDragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Palette.border, alignSelf: 'center', marginBottom: Spacing.sm },
  historyPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Spacing.md },
  historyPanelTitle: { color: Palette.text, fontSize: 20, fontWeight: '900' },
  historyCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Palette.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  historyTabRow: { flexDirection: 'row', backgroundColor: Palette.surfaceAlt, borderRadius: Radius.pill, padding: 4, gap: 4, marginBottom: Spacing.md },
  historyTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: Radius.pill, paddingVertical: 8 },
  historyTabActive: { backgroundColor: CoachColors.slate },
  historyTabText: { color: Palette.textMuted, fontSize: 14, fontWeight: '700' },
  historyTabTextActive: { color: '#fff' },
  historyListRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Palette.surfaceAlt, borderRadius: Radius.md, padding: Spacing.md },
  historyListDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Palette.success },
  monthGroupLabel: { color: CoachColors.blue, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Palette.border, marginBottom: Spacing.sm },
  payoutHero: { flexDirection: 'column', gap: Spacing.xs, backgroundColor: CoachColors.tealSoft, borderColor: 'rgba(31,157,114,0.22)', borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg },
  payoutHeroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.xs },
  payoutLabel: { color: Palette.textMuted, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  payoutValue: { color: Palette.text, fontSize: 34, lineHeight: 40, fontWeight: '900' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: { backgroundColor: '#FFFFFF', borderColor: Palette.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, minWidth: 136, flexGrow: 1 },
  statValue: { color: Palette.text, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  paymentSection: { gap: Spacing.md, borderTopWidth: 1, borderTopColor: Palette.border, paddingTop: Spacing.md },
  sectionTitle: { color: Palette.text, fontSize: 16, lineHeight: 22, fontWeight: '900' },
  bonusGrid: { gap: Spacing.md },
  bonusCard: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: Palette.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  payoutMonthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  payoutMonthSummary: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: '#FFFFFF', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Palette.border },
  payoutMonthStat: { flex: 1, alignItems: 'center', gap: 2 },
  payoutMonthStatVal: { color: Palette.text, fontSize: 15, fontWeight: '900' },
  paymentHistoryList: { gap: Spacing.md },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderColor: Palette.border, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  paymentAmountBox: { alignItems: 'flex-end', gap: 2 },
  paymentAmount: { color: Palette.success, fontSize: 17, lineHeight: 23, fontWeight: '900' },
  paymentStatus: { color: Palette.textMuted, fontSize: 11, lineHeight: 15, fontWeight: '900', textTransform: 'uppercase' },
});
