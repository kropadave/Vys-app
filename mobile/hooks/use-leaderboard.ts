import { useEffect, useState } from 'react';

import { hasSupabaseConfig, supabase } from '@/lib/supabase';

// Mascot IDs cycling from legendary → common as rank increases
const MASCOT_IDS = [
  'black-magic',   // rank 1
  'black-shadow',  // rank 2
  'black-sit',     // rank 3
  'darkp-magic',   // rank 4
  'darkp-fly',     // rank 5
  'darkp-sit',     // rank 6
  'purple-cool',   // rank 7
  'purple-run',    // rank 8
  'purple-sit',    // rank 9
  'pink-jump',     // rank 10
  'pink-wave',     // rank 11
  'pink-sit',      // rank 12
  'beige-wave',    // rank 13
  'beige-sleep',   // rank 14
  'beige-sit',     // rank 15+
];

export type ParticipantLeaderboardEntry = {
  rank: number;
  name: string;
  xp: number;
  mascotId: string;
  isMe?: boolean;
};

export type CoachLeaderboardEntry = {
  rank: number;
  name: string;
  xp: number;
  qr: number;
  bonus: string;
  avatarColor: string;
  initials: string;
  isMe?: boolean;
};

const AVATAR_COLORS = ['#1FB37A', '#8B1DFF', '#F12BB3', '#FFB21A', '#3B82F6', '#EF4444'];

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Participant leaderboard ─────────────────────────────────────────────────

type ParticipantRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  xp: number | null;
};

function nameFromRow(row: ParticipantRow): string {
  return `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'Účastník';
}

function isLiveParticipant(row: ParticipantRow): boolean {
  return !row.id.startsWith('demo-') && !row.id.startsWith('web-');
}

export function useParticipantLeaderboard(myUserId?: string) {
  const [entries, setEntries] = useState<ParticipantLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('participants')
        .select('id,first_name,last_name,xp')
        .order('xp', { ascending: false })
        .limit(20);

      if (cancelled || error || !data) {
        setLoading(false);
        return;
      }

      const rows = (data as ParticipantRow[]).filter(isLiveParticipant);
      const ranked = rows.map((row, index) => ({
        rank: index + 1,
        name: nameFromRow(row),
        xp: Number(row.xp ?? 0),
        mascotId: MASCOT_IDS[Math.min(index, MASCOT_IDS.length - 1)],
        isMe: myUserId ? row.id === myUserId : false,
      }));

      // If current user not in top 20, append them at the end
      if (myUserId && !ranked.some((e) => e.isMe)) {
        const { data: myData } = await supabase
          .from('participants')
          .select('id,first_name,last_name,xp')
          .eq('id', myUserId)
          .maybeSingle();
        if (myData) {
          const myRow = myData as ParticipantRow;
          // count how many have more xp
          const { count } = await supabase
            .from('participants')
            .select('id', { count: 'exact', head: true })
            .gt('xp', Number(myRow.xp ?? 0));
          ranked.push({
            rank: (count ?? ranked.length) + 1,
            name: nameFromRow(myRow),
            xp: Number(myRow.xp ?? 0),
            mascotId: 'beige-sit',
            isMe: true,
          });
        }
      }

      setEntries(ranked);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [myUserId]);

  return { entries, loading };
}

// ── Coach leaderboard ───────────────────────────────────────────────────────

type CoachProfileRow = {
  id: string;
  qr_tricks_approved: number | null;
  bonus_total: number | null;
  app_profiles: { name: string | null } | { name: string | null }[] | null;
};

export function useCoachLeaderboard(myCoachId?: string) {
  const [entries, setEntries] = useState<CoachLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('id,qr_tricks_approved,bonus_total,app_profiles(name)')
        .eq('approval_status', 'approved')
        .order('qr_tricks_approved', { ascending: false })
        .limit(20);

      if (cancelled || error || !data) {
        setLoading(false);
        return;
      }

      const rows = data as unknown as CoachProfileRow[];
      const ranked = rows.map((row, index) => {
        const ap = Array.isArray(row.app_profiles) ? row.app_profiles[0] : row.app_profiles;
        const name = ap?.name ?? 'Trenér';
        const qr = Number(row.qr_tricks_approved ?? 0);
        const bonusAmount = Number(row.bonus_total ?? 0);
        const bonusLabel = bonusAmount > 0 ? `+${bonusAmount} Kč` : 'čeká';
        return {
          rank: index + 1,
          name,
          xp: qr * 10, // 10 XP per QR approval as per design
          qr,
          bonus: bonusLabel,
          avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
          initials: initialsFromName(name),
          isMe: myCoachId ? row.id === myCoachId : false,
        };
      });

      setEntries(ranked);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [myCoachId]);

  return { entries, loading };
}
