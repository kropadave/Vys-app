import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { COINS_PER_SESSION, demoCoins, demoOwnedMascots, type OwnedMascot } from '@/lib/attendance-coins';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

type RewardsRow = {
  attendance_done: number | null;
  coins: number | null;
  converted_attendance: number | null;
  owned_mascots: OwnedMascot[] | null;
};

type RewardsState = {
  attendanceDone: number;
  coins: number;
  convertedAttendance: number;
  ownedMascots: OwnedMascot[];
};

const emptyRewards: RewardsState = {
  attendanceDone: 0,
  coins: 0,
  convertedAttendance: 0,
  ownedMascots: [],
};

const demoRewards: RewardsState = {
  attendanceDone: 7,
  coins: demoCoins,
  convertedAttendance: 5,
  ownedMascots: demoOwnedMascots,
};

export function useParticipantRewards() {
  const { session, loading: authLoading } = useAuth();
  const [state, setState] = useState<RewardsState>(DEV_BYPASS_AUTH ? demoRewards : emptyRewards);
  const [loading, setLoading] = useState(!DEV_BYPASS_AUTH);

  const participantId = session?.userId ?? null;

  const loadRewards = useCallback(async () => {
    if (DEV_BYPASS_AUTH) {
      setState(demoRewards);
      setLoading(false);
      return;
    }
    if (!hasSupabaseConfig || !supabase || !participantId) {
      setState(emptyRewards);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('participants')
      .select('attendance_done,coins,converted_attendance,owned_mascots')
      .eq('id', participantId)
      .maybeSingle();

    if (error || !data) {
      setState(emptyRewards);
      setLoading(false);
      return;
    }

    const row = data as RewardsRow;
    setState({
      attendanceDone: Number(row.attendance_done ?? 0),
      coins: Number(row.coins ?? 0),
      convertedAttendance: Number(row.converted_attendance ?? 0),
      ownedMascots: Array.isArray(row.owned_mascots) ? row.owned_mascots : [],
    });
    setLoading(false);
  }, [participantId]);

  useEffect(() => {
    if (authLoading) return;
    void loadRewards();
  }, [authLoading, loadRewards]);

  // Optimistically apply a state change locally and persist the writable fields.
  const persist = useCallback(
    async (next: RewardsState, patch: Partial<Pick<RewardsRow, 'coins' | 'converted_attendance' | 'owned_mascots'>>) => {
      setState(next);
      if (DEV_BYPASS_AUTH || !hasSupabaseConfig || !supabase || !participantId) return;
      const { error } = await supabase.from('participants').update(patch).eq('id', participantId);
      if (error) {
        // Re-sync from the server if the write failed so the UI does not drift.
        void loadRewards();
      }
    },
    [participantId, loadRewards],
  );

  const pending = Math.max(0, state.attendanceDone - state.convertedAttendance);

  const convertOne = useCallback(async () => {
    if (pending <= 0) return;
    const next: RewardsState = {
      ...state,
      convertedAttendance: state.convertedAttendance + 1,
      coins: state.coins + COINS_PER_SESSION,
    };
    await persist(next, { converted_attendance: next.convertedAttendance, coins: next.coins });
  }, [pending, state, persist]);

  const convertAll = useCallback(async () => {
    if (pending <= 0) return;
    const next: RewardsState = {
      ...state,
      convertedAttendance: state.convertedAttendance + pending,
      coins: state.coins + pending * COINS_PER_SESSION,
    };
    await persist(next, { converted_attendance: next.convertedAttendance, coins: next.coins });
  }, [pending, state, persist]);

  const buyCrate = useCallback(
    async ({ price, coinsReward = 0, mascot }: { price: number; coinsReward?: number; mascot?: OwnedMascot }) => {
      if (state.coins < price) return false;
      const nextCoins = state.coins - price + coinsReward;
      const nextMascots = mascot && !state.ownedMascots.some((m) => m.id === mascot.id)
        ? [...state.ownedMascots, { ...mascot, equippedOnProfile: false }]
        : state.ownedMascots;
      const next: RewardsState = { ...state, coins: nextCoins, ownedMascots: nextMascots };
      await persist(next, { coins: nextCoins, owned_mascots: nextMascots });
      return true;
    },
    [state, persist],
  );

  const equipMascot = useCallback(
    async (id: string) => {
      const nextMascots = state.ownedMascots.map((m) => ({ ...m, equippedOnProfile: m.id === id }));
      const next: RewardsState = { ...state, ownedMascots: nextMascots };
      await persist(next, { owned_mascots: nextMascots });
    },
    [state, persist],
  );

  return {
    loading,
    attendanceDone: state.attendanceDone,
    pending,
    coins: state.coins,
    convertedAttendance: state.convertedAttendance,
    ownedMascots: state.ownedMascots,
    reload: loadRewards,
    convertOne,
    convertAll,
    buyCrate,
    equipMascot,
  };
}
