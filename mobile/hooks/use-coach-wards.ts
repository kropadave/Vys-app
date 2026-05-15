import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import type { CoachWard } from '@/lib/coach-content';
import { braceletForXp } from '@/lib/participant-content';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  emergency_phone: string | null;
  active_course: string | null;
  level: number | null;
  xp: number | null;
  bracelet: string | null;
  bracelet_color: string | null;
  departure_mode: string | null;
  authorized_people: string | null;
  allergies: string | null;
  health_limits: string | null;
  medication_note: string | null;
  coach_note: string | null;
  school_year: string | null;
};

function wardFromRow(row: ParticipantRow): CoachWard {
  const xp = Number(row.xp ?? 0);
  const name = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'Účastník';
  const bracelet = braceletForXp(xp, row.bracelet, row.bracelet_color);
  const course = row.active_course ?? '';
  return {
    id: row.id,
    name,
    parentName: row.parent_name ?? '',
    locations: course ? [course] : [],
    activityType: 'krouzek',
    parentPhone: row.parent_phone ?? '',
    emergencyPhone: row.emergency_phone ?? '',
    birthYear: 0,
    schoolYear: row.school_year ?? '',
    coachNote: row.coach_note ?? '',
    departure: {
      mode: (row.departure_mode as CoachWard['departure']['mode']) ?? 'parent',
      signed: false,
      signedAt: '',
      authorizedPeople: row.authorized_people ?? '',
      note: '',
    },
    health: {
      allergies: row.allergies ?? '',
      limits: row.health_limits ?? '',
      medication: row.medication_note ?? '',
      emergencyPhone: row.emergency_phone ?? '',
    },
    level: Number(row.level ?? 1),
    bracelet: bracelet.title,
    braceletColor: bracelet.color,
    paymentStatus: 'Zaplaceno',
    physicalBraceletReceived: false,
    hasNfcChip: false,
    passTitle: '',
    entriesLeft: 0,
    lastAttendance: '',
    completedTrickIds: [],
  };
}

function isLiveParticipant(row: ParticipantRow): boolean {
  return !row.id.startsWith('demo-') && !row.id.startsWith('web-');
}

/**
 * Loads participants assigned to this coach's courses from Supabase.
 * Falls back to an empty list (not mock data) when Supabase is unavailable.
 */
export function useCoachWards() {
  const { session } = useAuth();
  const [wards, setWards] = useState<CoachWard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);

      // 1. Get this coach's assigned courses
      let assignedCourses: string[] = [];
      if (session?.userId) {
        const { data: coachData } = await supabase
          .from('coach_profiles')
          .select('assigned_courses')
          .eq('id', session.userId)
          .maybeSingle();
        assignedCourses = (coachData?.assigned_courses as string[] | null) ?? [];
      }

      if (assignedCourses.length === 0) {
        setWards([]);
        setLoading(false);
        return;
      }

      // 2. Fetch participants for this coach's real assigned courses.
      const query = supabase
        .from('participants')
        .select(
          'id,first_name,last_name,parent_name,parent_phone,emergency_phone,active_course,level,xp,bracelet,bracelet_color,departure_mode,authorized_people,allergies,health_limits,medication_note,coach_note,school_year',
        )
        .order('first_name', { ascending: true });

      const { data, error } = await query.in('active_course', assignedCourses);

      if (cancelled) return;

      if (error || !data) {
        setLoading(false);
        return;
      }

      setWards((data as ParticipantRow[]).filter(isLiveParticipant).map(wardFromRow));
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [session?.userId]);

  return { wards, loading };
}
