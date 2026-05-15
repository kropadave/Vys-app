import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import type { CoachSession, SharedTrainingSlot } from '@/lib/coach-content';
import { courses, type Course } from '@/lib/public-content';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const FALLBACK_COACH_ID = 'coach-demo';
const DEFAULT_HOURLY_RATE = 500;
const WORKSHOP_SESSION_PREFIX = 'coach-workshop-';
const HIDDEN_COACH_IDS = new Set([FALLBACK_COACH_ID]);
const HIDDEN_COACH_NAMES = new Set(['Filip Trenér']);

type CoachSessionRow = {
  id: string;
  coach_id: string;
  city: string;
  venue: string;
  day: string;
  time: string;
  group_name: string;
  enrolled: number;
  present: number;
  duration_hours: number | string;
  hourly_rate: number;
  latitude: number | null;
  longitude: number | null;
  check_in_radius_meters: number;
};

type CoachNameRow = {
  id: string;
  name: string | null;
};

let sharedSlotsCache: SharedTrainingSlot[] = courseSlots();
const sharedSlotListeners = new Set<(slots: SharedTrainingSlot[]) => void>();

export type CoachSessionInput = {
  city: string;
  venue: string;
  day: string;
  time: string;
  group: string;
  latitude?: number | null;
  longitude?: number | null;
  checkInRadiusMeters?: number;
  durationHours?: number;
  hourlyRate?: number;
};

function courseLocation(course: Course) {
  return `${course.city} · ${course.venue}`;
}

function courseTime(course: Course) {
  return `${course.from} - ${course.to}`;
}

function courseGroup(course: Course) {
  return `Kroužek ${course.city}`;
}

function courseKey(course: Pick<Course, 'city' | 'venue' | 'day'> & { from?: string; to?: string; time?: string }) {
  const time = course.time ?? `${course.from} - ${course.to}`;
  return `${course.city}|${course.venue}|${course.day}|${time}`;
}

function rowKey(row: Pick<CoachSessionRow, 'city' | 'venue' | 'day' | 'time'>) {
  return `${row.city}|${row.venue}|${row.day}|${row.time}`;
}

function sessionKey(sessionItem: Pick<CoachSession, 'city' | 'venue' | 'day' | 'time'>) {
  return `${sessionItem.city}|${sessionItem.venue}|${sessionItem.day}|${sessionItem.time}`;
}

function courseMatchesSession(course: Course, sessionItem: Pick<CoachSession, 'city' | 'venue' | 'day' | 'time'>) {
  return courseKey(course) === sessionKey(sessionItem);
}

function durationHours(course: Course) {
  const [fromHour, fromMinute] = course.from.split(':').map(Number);
  const [toHour, toMinute] = course.to.split(':').map(Number);
  if (![fromHour, fromMinute, toHour, toMinute].every(Number.isFinite)) return 1;

  const minutes = (toHour * 60 + toMinute) - (fromHour * 60 + fromMinute);
  return minutes > 0 ? minutes / 60 : 1;
}

function rowToSession(row: CoachSessionRow): CoachSession {
  return {
    id: row.id,
    city: row.city,
    venue: row.venue,
    day: row.day,
    time: row.time,
    group: row.group_name,
    enrolled: row.enrolled,
    present: row.present,
    durationHours: Number(row.duration_hours),
    hourlyRate: row.hourly_rate,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    checkInRadiusMeters: row.check_in_radius_meters ?? 300,
  };
}

function isHiddenCoach(row: Pick<CoachSessionRow, 'coach_id'>, coachName?: string) {
  return HIDDEN_COACH_IDS.has(row.coach_id) || (coachName ? HIDDEN_COACH_NAMES.has(coachName) : false);
}

function isWorkshopSession(row: Pick<CoachSessionRow, 'id' | 'group_name'>) {
  return row.id.startsWith(WORKSHOP_SESSION_PREFIX) || row.group_name.startsWith('Workshop:');
}

function emitSharedSlots(slots: SharedTrainingSlot[]) {
  sharedSlotsCache = slots;
  for (const listener of sharedSlotListeners) listener(slots);
}

async function loadSharedCoachSessionSlots(): Promise<SharedTrainingSlot[]> {
  if (!hasSupabaseConfig || !supabase) return courseSlots();

  const [{ data: sessionsData }, { data: profilesData }] = await Promise.all([
    supabase.from('coach_sessions').select('*'),
    supabase.from('app_profiles').select('id, name'),
  ]);

  const nameById = new Map<string, string>(
    ((profilesData as CoachNameRow[] | null) ?? []).map((profile) => [profile.id, profile.name ?? 'Trenér']),
  );

  const slotByKey = new Map<string, SharedTrainingSlot>();
  for (const slot of courseSlots()) {
    const course = courses.find((item) => item.id === slot.id);
    if (course) slotByKey.set(courseKey(course), slot);
  }

  for (const row of (sessionsData as CoachSessionRow[] | null) ?? []) {
    if (isWorkshopSession(row)) continue;
    const key = rowKey(row);
    const coachName = nameById.get(row.coach_id) ?? 'Trenér';
    if (isHiddenCoach(row, coachName)) continue;
    const existing = slotByKey.get(key) ?? {
      id: row.id,
      activityType: 'Krouzek' as const,
      day: row.day,
      time: row.time,
      place: `${row.city} · ${row.venue}`,
      group: row.group_name,
      regularCoachId: '',
      regularCoachName: '',
      updatedAt: '',
    };

    const isAlreadyAssigned = existing.assignedCoachId === row.coach_id || existing.secondCoachId === row.coach_id;
    const shouldAssignFirst = !existing.assignedCoachId;
    const shouldAssignSecond = Boolean(existing.assignedCoachId) && !existing.secondCoachId && !isAlreadyAssigned;

    slotByKey.set(key, {
      ...existing,
      regularCoachId: existing.regularCoachId || row.coach_id,
      regularCoachName: existing.regularCoachName || coachName,
      assignedCoachId: shouldAssignFirst ? row.coach_id : existing.assignedCoachId,
      assignedCoachName: shouldAssignFirst ? coachName : existing.assignedCoachName,
      secondCoachId: shouldAssignSecond ? row.coach_id : existing.secondCoachId,
      secondCoachName: shouldAssignSecond ? coachName : existing.secondCoachName,
      updatedAt: 'aktuální obsazení',
    });
  }

  return Array.from(slotByKey.values());
}

export async function refreshCoachSessionSlots() {
  const slots = await loadSharedCoachSessionSlots().catch(() => courseSlots());
  emitSharedSlots(slots);
  return slots;
}

/**
 * Loads the current coach's assigned sessions from coach_sessions in Supabase.
 */
export function useCoachSessions() {
  const { session } = useAuth();
  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const coachId = session?.userId ?? '';
    if (!hasSupabaseConfig || !supabase || !coachId) {
      setSessions([]);
      setLoading(false);
      return;
    }

    supabase
      .from('coach_sessions')
      .select('*')
      .eq('coach_id', coachId)
      .then(({ data, error }) => {
        if (!error && data) {
          setSessions((data as CoachSessionRow[]).filter((row) => !isWorkshopSession(row)).map(rowToSession));
        }
        setLoading(false);
      });
  }, [session?.userId]);

  const addSession = async (input: CoachSessionInput) => {
    const coachId = session?.userId ?? '';
    if (!hasSupabaseConfig || !supabase || !coachId) throw new Error('Nejsi přihlášený jako trenér.');

    const id = `coach-session-${coachId}-${Date.now()}`;
    const row = {
      id,
      coach_id: coachId,
      city: input.city.trim(),
      venue: input.venue.trim(),
      day: input.day,
      time: input.time.trim(),
      group_name: input.group.trim(),
      enrolled: 0,
      present: 0,
      duration_hours: input.durationHours ?? 1,
      hourly_rate: input.hourlyRate ?? DEFAULT_HOURLY_RATE,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      check_in_radius_meters: input.checkInRadiusMeters ?? 300,
    } satisfies CoachSessionRow;

    const { error } = await supabase.from('coach_sessions').upsert(row);
    if (error) throw error;

    const nextSession = rowToSession(row);
    setSessions((current) => [nextSession, ...current.filter((item) => item.id !== nextSession.id)]);

    const location = `${row.city} · ${row.venue}`;
    const { data: profile } = await supabase
      .from('coach_profiles')
      .select('assigned_courses')
      .eq('id', coachId)
      .maybeSingle();
    const assignedCourses = Array.isArray(profile?.assigned_courses) ? profile.assigned_courses as string[] : [];
    await supabase.from('coach_profiles').upsert({
      id: coachId,
      current_location: location,
      assigned_courses: Array.from(new Set([location, ...assignedCourses])),
    });

    void refreshCoachSessionSlots();

    return nextSession;
  };

  const assignCourse = async (courseId: string) => {
    const coachId = session?.userId ?? '';
    if (!hasSupabaseConfig || !supabase || !coachId) throw new Error('Nejsi přihlášený jako trenér.');

    const course = courses.find((item) => item.id === courseId);
    if (!course) throw new Error('Tenhle kroužek už není v aktuální nabídce.');

    const row = {
      id: `coach-session-${coachId}-${course.id}`,
      coach_id: coachId,
      city: course.city,
      venue: course.venue,
      day: course.day,
      time: courseTime(course),
      group_name: courseGroup(course),
      enrolled: 0,
      present: 0,
      duration_hours: durationHours(course),
      hourly_rate: DEFAULT_HOURLY_RATE,
      latitude: null,
      longitude: null,
      check_in_radius_meters: 300,
    } satisfies CoachSessionRow;

    const { error } = await supabase.from('coach_sessions').upsert(row);
    if (error) throw error;

    const nextSession = rowToSession(row);
    setSessions((current) => [nextSession, ...current.filter((item) => item.id !== nextSession.id && !courseMatchesSession(course, item))]);

    const location = courseLocation(course);
    const { data: profile } = await supabase
      .from('coach_profiles')
      .select('assigned_courses')
      .eq('id', coachId)
      .maybeSingle();
    const assignedCourses = Array.isArray(profile?.assigned_courses) ? profile.assigned_courses as string[] : [];
    await supabase.from('coach_profiles').upsert({
      id: coachId,
      current_location: location,
      assigned_courses: Array.from(new Set([location, ...assignedCourses])),
    });

    void refreshCoachSessionSlots();

    return nextSession;
  };

  const removeSession = async (sessionId: string) => {
    const coachId = session?.userId ?? '';
    if (!hasSupabaseConfig || !supabase || !coachId) throw new Error('Nejsi přihlášený jako trenér.');

    const removedSession = sessions.find((item) => item.id === sessionId);
    const { error } = await supabase.from('coach_sessions').delete().eq('id', sessionId).eq('coach_id', coachId);
    if (error) throw error;

    const nextSessions = sessions.filter((item) => item.id !== sessionId);
    setSessions(nextSessions);

    if (removedSession) {
      const assignedCourses = Array.from(new Set(nextSessions.map((item) => `${item.city} · ${item.venue}`)));
      await supabase.from('coach_profiles').upsert({
        id: coachId,
        current_location: assignedCourses[0] ?? null,
        assigned_courses: assignedCourses,
      });
    }

    void refreshCoachSessionSlots();
  };

  return { sessions, loading, addSession, assignCourse, removeSession };
}

/**
 * Loads ALL coach sessions from Supabase and maps them to SharedTrainingSlot[]
 * so the shared calendar can show every coach's recurring schedule.
 */
export function useAllCoachSessions() {
  const [slots, setSlots] = useState<SharedTrainingSlot[]>(() => sharedSlotsCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const listener = (nextSlots: SharedTrainingSlot[]) => setSlots(nextSlots);
    sharedSlotListeners.add(listener);

    refreshCoachSessionSlots().finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      sharedSlotListeners.delete(listener);
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      await refreshCoachSessionSlots();
    } finally {
      setLoading(false);
    }
  };

  return { slots, loading, refresh };
}

function courseSlots(): SharedTrainingSlot[] {
  return courses.map((course) => ({
    id: course.id,
    activityType: 'Krouzek' as const,
    day: course.day,
    time: courseTime(course),
    place: courseLocation(course),
    group: courseGroup(course),
    regularCoachId: '',
    regularCoachName: '',
    updatedAt: 'aktuální nabídka kroužků',
  }));
}
