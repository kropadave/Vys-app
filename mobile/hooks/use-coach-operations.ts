import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';

import { loadDigitalPasses, recordDigitalPassScan, type DigitalPassScanResult } from '@/hooks/use-digital-passes';
import type { ChildAttendanceRecord, CoachSession } from '@/lib/coach-content';
import { childAttendanceHistory, coachWards } from '@/lib/coach-content';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const COACH_ID = 'coach-demo';
const HOURLY_RATE = 500;
const COACH_ATTENDANCE_KEY = 'vys.coachAttendanceRecords';
const CHILD_ATTENDANCE_KEY = 'vys.childAttendanceRecords';
const NFC_ASSIGNMENTS_KEY = 'vys.nfcChipAssignments';
const SEEDED_COACH_ATTENDANCE_IDS = new Set([
  'coach-att-2026-04-24-nadrazni',
  'coach-att-2026-04-22-purkynova',
  'coach-att-2026-04-18-prostejov',
]);

export type StoredCoachAttendanceRecord = {
  id: string;
  coachId: string;
  sessionId?: string;
  date: string;
  place: string;
  status: 'Zapsáno';
  present: string;
  durationHours: number;
  hourlyRate: number;
  amount: number;
};

export type CoachPayoutStats = {
  hourlyRate: number;
  loggedHours: number;
  baseAmount: number;
  approvedBonuses: number;
  pendingBonuses: number;
  nextPayout: string;
  status: string;
};

export type NfcChipAssignment = {
  id: string;
  chipId: string;
  wardId: string;
  participantName: string;
  location: string;
  assignedAt: string;
};

export type NfcScanResult =
  | { status: 'logged'; chipId: string; assignment: NfcChipAssignment; record: ChildAttendanceRecord; passResult: DigitalPassScanResult }
  | { status: 'pass-rejected'; chipId: string; assignment: NfcChipAssignment; passResult: DigitalPassScanResult }
  | { status: 'unknown'; chipId: string }
  | { status: 'wrong-location'; chipId: string; assignment: NfcChipAssignment; expectedLocations: string[] };

type CoachAttendanceRow = {
  id: string;
  coach_id: string;
  session_id: string | null;
  date_text: string;
  place: string;
  status: 'Zapsáno';
  present: string | null;
  duration_hours: number | string;
  hourly_rate: number;
  amount: number;
};

type ChildAttendanceRow = {
  id: string;
  session_id: string | null;
  date_text: string;
  location: string;
  attendees: ChildAttendanceRecord['attendees'];
};

type CoachPayoutRow = {
  id: string;
  hourly_rate: number;
  approved_bonuses: number;
  pending_bonuses: number;
  next_payout: string;
  status: string;
};

type NfcChipAssignmentRow = {
  chip_id: string;
  ward_id: string;
  participant_name: string;
  location: string;
  assigned_at_text: string;
};

async function resolveCurrentCoachId() {
  if (!hasSupabaseConfig || !supabase) return COACH_ID;

  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? COACH_ID;
}

type CoachOperationState = {
  coachAttendanceRecords: StoredCoachAttendanceRecord[];
  childAttendanceRecords: ChildAttendanceRecord[];
  nfcChipAssignments: NfcChipAssignment[];
  payoutConfig: Omit<CoachPayoutStats, 'loggedHours' | 'baseAmount'>;
};

const fallbackPayoutConfig = {
  hourlyRate: HOURLY_RATE,
  approvedBonuses: 0,
  pendingBonuses: 0,
  nextPayout: 'Bez záznamu',
  status: 'Čeká na první zapsaný trénink',
};

let cached: CoachOperationState | null = null;
const listeners = new Set<(state: CoachOperationState) => void>();

function emit(state: CoachOperationState) {
  cached = state;
  for (const listener of listeners) listener(state);
}

function dateText() {
  return new Date().toLocaleDateString('cs-CZ');
}

function dateKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeChipId(chipId: string) {
  return chipId.trim().replace(/\s+/g, '').toUpperCase();
}

function timeText() {
  return new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

function staticNfcChipAssignments(): NfcChipAssignment[] {
  return coachWards
    .filter((ward) => ward.nfcChipId)
    .map((ward) => {
      const chipId = normalizeChipId(ward.nfcChipId ?? '');
      return {
        id: chipId,
        chipId,
        wardId: ward.id,
        participantName: ward.name,
        location: ward.locations[0] ?? '',
        assignedAt: 'Výchozí čip',
      };
    });
}

function parseJsonList<T>(value: string | null, fallback: T[]): T[] {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function mergeById<T extends { id: string }>(primary: T[], fallback: T[]) {
  const seen = new Set(primary.map((item) => item.id));
  return [...primary, ...fallback.filter((item) => !seen.has(item.id))];
}

function coachAttendanceFromRow(row: CoachAttendanceRow): StoredCoachAttendanceRecord {
  return {
    id: row.id,
    coachId: row.coach_id,
    sessionId: row.session_id ?? undefined,
    date: row.date_text,
    place: row.place,
    status: row.status,
    present: row.present ?? '',
    durationHours: Number(row.duration_hours),
    hourlyRate: row.hourly_rate,
    amount: row.amount,
  };
}

function coachAttendanceToRow(record: StoredCoachAttendanceRecord): CoachAttendanceRow {
  const canReferenceSession = record.sessionId?.startsWith('coach-session-') || record.sessionId?.startsWith('session-');
  return {
    id: record.id,
    coach_id: record.coachId,
    session_id: canReferenceSession ? record.sessionId ?? null : null,
    date_text: record.date,
    place: record.place,
    status: record.status,
    present: record.present,
    duration_hours: record.durationHours,
    hourly_rate: record.hourlyRate,
    amount: record.amount,
  };
}

function isSeededCoachAttendanceRecord(record: StoredCoachAttendanceRecord) {
  return record.coachId === COACH_ID && SEEDED_COACH_ATTENDANCE_IDS.has(record.id);
}

function childAttendanceFromRow(row: ChildAttendanceRow): ChildAttendanceRecord {
  return {
    id: row.id,
    date: row.date_text,
    location: row.location,
    attendees: Array.isArray(row.attendees) ? row.attendees : [],
  };
}

function childAttendanceToRow(record: ChildAttendanceRecord, sessionId?: string): ChildAttendanceRow {
  return {
    id: record.id,
    session_id: sessionId ?? null,
    date_text: record.date,
    location: record.location,
    attendees: record.attendees,
  };
}

function nfcAssignmentFromRow(row: NfcChipAssignmentRow): NfcChipAssignment {
  const chipId = normalizeChipId(row.chip_id);
  return {
    id: chipId,
    chipId,
    wardId: row.ward_id,
    participantName: row.participant_name,
    location: row.location,
    assignedAt: row.assigned_at_text,
  };
}

function nfcAssignmentToRow(assignment: NfcChipAssignment): NfcChipAssignmentRow {
  return {
    chip_id: assignment.chipId,
    ward_id: assignment.wardId,
    participant_name: assignment.participantName,
    location: assignment.location,
    assigned_at_text: assignment.assignedAt,
  };
}

async function loadLocalCoachAttendance() {
  const value = await AsyncStorage.getItem(COACH_ATTENDANCE_KEY);
  return parseJsonList<StoredCoachAttendanceRecord>(value, []);
}

async function loadLocalChildAttendance() {
  const value = await AsyncStorage.getItem(CHILD_ATTENDANCE_KEY);
  return parseJsonList<ChildAttendanceRecord>(value, []);
}

async function loadLocalNfcAssignments() {
  const value = await AsyncStorage.getItem(NFC_ASSIGNMENTS_KEY);
  return parseJsonList<NfcChipAssignment>(value, []);
}

async function saveLocalCoachAttendance(records: StoredCoachAttendanceRecord[]) {
  try {
    await AsyncStorage.setItem(COACH_ATTENDANCE_KEY, JSON.stringify(records));
  } catch {
    // keep the prototype resilient if local storage is unavailable
  }
}

async function saveLocalChildAttendance(records: ChildAttendanceRecord[]) {
  try {
    await AsyncStorage.setItem(CHILD_ATTENDANCE_KEY, JSON.stringify(records));
  } catch {
    // keep the prototype resilient if local storage is unavailable
  }
}

async function saveLocalNfcAssignments(assignments: NfcChipAssignment[]) {
  try {
    await AsyncStorage.setItem(NFC_ASSIGNMENTS_KEY, JSON.stringify(assignments));
  } catch {
    // keep the prototype resilient if local storage is unavailable
  }
}

async function loadCoachAttendanceRecords() {
  const coachId = await resolveCurrentCoachId();

  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('coach_attendance_records')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (!error && data) return (data as CoachAttendanceRow[]).map(coachAttendanceFromRow).filter((record) => !isSeededCoachAttendanceRecord(record));
  }

  const localRecords = await loadLocalCoachAttendance();
  return localRecords.filter((record) => record.coachId === coachId && !isSeededCoachAttendanceRecord(record));
}

async function loadChildAttendanceRecords() {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('child_attendance_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) return (data as ChildAttendanceRow[]).map(childAttendanceFromRow);
  }

  const localRecords = await loadLocalChildAttendance();
  return mergeById(localRecords, childAttendanceHistory);
}

async function loadNfcChipAssignments() {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('nfc_chip_assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) return mergeById((data as NfcChipAssignmentRow[]).map(nfcAssignmentFromRow), staticNfcChipAssignments());
  }

  const localAssignments = await loadLocalNfcAssignments();
  return mergeById(localAssignments, staticNfcChipAssignments());
}

async function loadPayoutConfig() {
  if (hasSupabaseConfig && supabase) {
    const coachId = await resolveCurrentCoachId();
    const { data, error } = await supabase
      .from('coach_payouts')
      .select('id, hourly_rate, approved_bonuses, pending_bonuses, next_payout, status')
      .eq('coach_id', coachId)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const row = data as CoachPayoutRow;
      if (coachId === COACH_ID && row.id === 'payout-coach-demo-current') return fallbackPayoutConfig;
      return {
        hourlyRate: row.hourly_rate,
        approvedBonuses: row.approved_bonuses,
        pendingBonuses: row.pending_bonuses,
        nextPayout: row.next_payout,
        status: row.status,
      };
    }
  }

  return fallbackPayoutConfig;
}

async function loadCoachOperationState(): Promise<CoachOperationState> {
  const [coachAttendanceRecords, childAttendanceRecords, nfcChipAssignments, payoutConfig] = await Promise.all([
    loadCoachAttendanceRecords(),
    loadChildAttendanceRecords(),
    loadNfcChipAssignments(),
    loadPayoutConfig(),
  ]);

  return { coachAttendanceRecords, childAttendanceRecords, nfcChipAssignments, payoutConfig };
}

function calculatePayout(records: StoredCoachAttendanceRecord[], config: Omit<CoachPayoutStats, 'loggedHours' | 'baseAmount'>): CoachPayoutStats {
  const loggedHours = records.reduce((sum, record) => sum + record.durationHours, 0);
  const baseAmount = records.reduce((sum, record) => sum + record.amount, 0);

  return { ...config, loggedHours, baseAmount };
}

async function syncPayout(records: StoredCoachAttendanceRecord[], config: Omit<CoachPayoutStats, 'loggedHours' | 'baseAmount'>) {
  if (!hasSupabaseConfig || !supabase) return;

  const coachId = await resolveCurrentCoachId();
  const stats = calculatePayout(records, config);
  await supabase.from('coach_payouts').upsert({
    id: `payout-${coachId}-current`,
    coach_id: coachId,
    hourly_rate: stats.hourlyRate,
    logged_hours: stats.loggedHours,
    base_amount: stats.baseAmount,
    approved_bonuses: stats.approvedBonuses,
    pending_bonuses: stats.pendingBonuses,
    next_payout: stats.nextPayout,
    status: stats.status,
    updated_at: new Date().toISOString(),
  });
}

export function useCoachOperations() {
  const [state, setState] = useState<CoachOperationState>(cached ?? {
    coachAttendanceRecords: [],
    childAttendanceRecords: [],
    nfcChipAssignments: staticNfcChipAssignments(),
    payoutConfig: fallbackPayoutConfig,
  });
  const [ready, setReady] = useState(cached !== null);

  useEffect(() => {
    let mounted = true;

    if (cached === null) {
      loadCoachOperationState().then((loadedState) => {
        if (!mounted) return;
        emit(loadedState);
        setState(loadedState);
        setReady(true);
      });
    } else {
      setReady(true);
    }

    const listener = (nextState: CoachOperationState) => setState(nextState);
    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  const payoutStats = useMemo(() => calculatePayout(state.coachAttendanceRecords, state.payoutConfig), [state.coachAttendanceRecords, state.payoutConfig]);

  const logCoachAttendance = async (session: CoachSession) => {
    const coachId = await resolveCurrentCoachId();
    const place = `${session.city} · ${session.venue}`;
    const present = session.enrolled > 0 ? `${session.present}/${session.enrolled}` : '';
    const canReferenceSession = session.id.startsWith('coach-session-') || session.id.startsWith('session-');
    const record: StoredCoachAttendanceRecord = {
      id: `coach-att-${coachId}-${session.id}-${dateKey()}`,
      coachId,
      sessionId: canReferenceSession ? session.id : undefined,
      date: dateText(),
      place,
      status: 'Zapsáno',
      present,
      durationHours: session.durationHours ?? 1,
      hourlyRate: session.hourlyRate ?? HOURLY_RATE,
      amount: (session.durationHours ?? 1) * (session.hourlyRate ?? HOURLY_RATE),
    };
    let savedRecord = record;
    let saveLocally = !hasSupabaseConfig || !supabase;

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase
        .from('coach_attendance_records')
        .upsert(coachAttendanceToRow(record))
        .select('*')
        .single();
      if (error) {
        saveLocally = true;
      } else if (data) {
        savedRecord = coachAttendanceFromRow(data as CoachAttendanceRow);
      }
    }

    const nextCoachRecords = [savedRecord, ...state.coachAttendanceRecords.filter((item) => item.id !== savedRecord.id)];
    const nextState = { ...state, coachAttendanceRecords: nextCoachRecords };

    if (saveLocally) {
      await saveLocalCoachAttendance(nextCoachRecords);
    }

    await syncPayout(nextCoachRecords, state.payoutConfig);
    emit(nextState);
    return savedRecord;
  };

  const addChildAttendanceEntry = async ({ sessionId, location, participantName, method, dateOverride, syncBackend = true }: { sessionId?: string; location: string; participantName: string; method: 'NFC' | 'Ručně'; dateOverride?: { isoKey: string; label: string }; syncBackend?: boolean }) => {
    const key = dateOverride ? dateOverride.isoKey : dateKey();
    const label = dateOverride ? dateOverride.label : dateText();
    const id = `children-${sessionId ?? 'manual'}-${key}`;
    const currentRecord = state.childAttendanceRecords.find((record) => record.id === id);
    const attendee = { name: participantName, time: timeText(), method };
    const nextRecord: ChildAttendanceRecord = currentRecord
      ? { ...currentRecord, attendees: [...currentRecord.attendees.filter((item) => item.name !== participantName), attendee] }
      : { id, date: label, location, attendees: [attendee] };
    const nextChildRecords = [nextRecord, ...state.childAttendanceRecords.filter((record) => record.id !== id)];
    const nextState = { ...state, childAttendanceRecords: nextChildRecords };

    if (syncBackend && hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('child_attendance_records').upsert(childAttendanceToRow(nextRecord, sessionId));
      if (error) await saveLocalChildAttendance(nextChildRecords);
    } else {
      await saveLocalChildAttendance(nextChildRecords);
    }

    emit(nextState);
    return nextRecord;
  };

  const assignNfcChipToWard = async ({ chipId, wardId }: { chipId: string; wardId: string }) => {
    const normalizedChipId = normalizeChipId(chipId);
    const ward = coachWards.find((item) => item.id === wardId);

    if (!normalizedChipId || !ward) return null;

    const assignment: NfcChipAssignment = {
      id: normalizedChipId,
      chipId: normalizedChipId,
      wardId: ward.id,
      participantName: ward.name,
      location: ward.locations[0] ?? '',
      assignedAt: new Date().toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    const nextAssignments = [assignment, ...state.nfcChipAssignments.filter((item) => item.chipId !== normalizedChipId && item.wardId !== wardId)];
    const nextState = { ...state, nfcChipAssignments: nextAssignments };

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('nfc_chip_assignments').upsert(nfcAssignmentToRow(assignment));
      if (error) await saveLocalNfcAssignments(nextAssignments);
    } else {
      await saveLocalNfcAssignments(nextAssignments);
    }

    emit(nextState);
    return assignment;
  };

  const scanChildNfcChip = async ({ chipId, sessionId, location }: { chipId: string; sessionId?: string; location: string }): Promise<NfcScanResult> => {
    const normalizedChipId = normalizeChipId(chipId);
    let assignment = state.nfcChipAssignments.find((item) => item.chipId === normalizedChipId);

    if (!assignment) {
      const passes = await loadDigitalPasses();
      const pass = passes.find((item) => normalizeChipId(item.nfcChipId) === normalizedChipId);
      if (!pass) return { status: 'unknown', chipId: normalizedChipId };

      const ward = coachWards.find((item) => item.name === pass.holderName);
      assignment = {
        id: normalizedChipId,
        chipId: normalizedChipId,
        wardId: ward?.id ?? pass.participantId,
        participantName: pass.holderName,
        location: pass.location,
        assignedAt: 'Digitální vstup',
      };
    }

    const ward = coachWards.find((item) => item.id === assignment.wardId);
    if (ward && !ward.locations.includes(location)) {
      return { status: 'wrong-location', chipId: normalizedChipId, assignment, expectedLocations: ward.locations };
    }
    if (!ward && assignment.location !== location) {
      return { status: 'wrong-location', chipId: normalizedChipId, assignment, expectedLocations: [assignment.location] };
    }

    const passResult = await recordDigitalPassScan({ chipId: normalizedChipId, holderName: assignment.participantName, location, sessionId });
    if (passResult.status !== 'updated') return { status: 'pass-rejected', chipId: normalizedChipId, assignment, passResult };

    const record = await addChildAttendanceEntry({ sessionId, location, participantName: assignment.participantName, method: 'NFC', syncBackend: !passResult.attendanceSynced });
    return { status: 'logged', chipId: normalizedChipId, assignment, record, passResult };
  };

  return {
    ready,
    coachAttendanceRecords: state.coachAttendanceRecords,
    childAttendanceRecords: state.childAttendanceRecords,
    nfcChipAssignments: state.nfcChipAssignments,
    payoutStats,
    logCoachAttendance,
    addChildAttendanceEntry,
    assignNfcChipToWard,
    scanChildNfcChip,
  };
}
