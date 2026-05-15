import { useCallback, useState } from 'react';

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

export function useParticipantSearch() {
  const [results, setResults] = useState<CoachWard[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const search = useCallback(async (name: string) => {
    setQuery(name);

    if (name.trim().length < 2) {
      setResults([]);
      return;
    }

    if (!hasSupabaseConfig || !supabase) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const normalized = name.trim();
      const { data, error } = await supabase
        .from('participants')
        .select(
          'id,first_name,last_name,parent_name,parent_phone,emergency_phone,active_course,level,xp,bracelet,bracelet_color,departure_mode,authorized_people,allergies,health_limits,medication_note,coach_note,school_year',
        )
        .or(`first_name.ilike.%${normalized}%,last_name.ilike.%${normalized}%`)
        .not('id', 'like', 'demo-%')
        .not('id', 'like', 'web-%')
        .order('first_name', { ascending: true })
        .limit(20);

      if (!error && data) {
        setResults((data as ParticipantRow[]).map(wardFromRow));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return { query, results, loading, search, clear };
}
