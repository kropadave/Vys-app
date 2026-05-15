import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import type { CoachTrick } from '@/lib/coach-content';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const STORAGE_KEY = 'vys.manualTrickAwards';
const COACH_ID = 'coach-demo';

export type ManualTrickAward = {
  id: string;
  wardId: string;
  participantId?: string;
  participantName: string;
  trickId: string;
  trickTitle: string;
  coachId: string;
  awardedAt: string;
};

type ManualTrickAwardRow = {
  id: string;
  ward_id: string;
  participant_id?: string | null;
  participant_name: string;
  trick_id: string;
  trick_title: string;
  coach_id: string;
  awarded_at_text: string;
};

type AwardManualTrickInput = {
  wardId: string;
  participantId?: string;
  participantName: string;
  trick: CoachTrick;
};

async function resolveCurrentCoachId() {
  if (!hasSupabaseConfig || !supabase) return COACH_ID;

  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? COACH_ID;
}

let cached: ManualTrickAward[] | null = null;
const listeners = new Set<(awards: ManualTrickAward[]) => void>();

function emit(awards: ManualTrickAward[]) {
  cached = awards;
  for (const listener of listeners) listener(awards);
}

function parseAwards(value: string | null): ManualTrickAward[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is ManualTrickAward => typeof item?.id === 'string') : [];
  } catch {
    return [];
  }
}

function awardFromRow(row: ManualTrickAwardRow): ManualTrickAward {
  return {
    id: row.id,
    wardId: row.ward_id,
    participantId: row.participant_id ?? undefined,
    participantName: row.participant_name,
    trickId: row.trick_id,
    trickTitle: row.trick_title,
    coachId: row.coach_id,
    awardedAt: row.awarded_at_text,
  };
}

function rowFromAward(award: ManualTrickAward): ManualTrickAwardRow {
  return {
    id: award.id,
    ward_id: award.wardId,
    participant_id: award.participantId ?? null,
    participant_name: award.participantName,
    trick_id: award.trickId,
    trick_title: award.trickTitle,
    coach_id: award.coachId,
    awarded_at_text: award.awardedAt,
  };
}

async function loadLocalAwards() {
  try {
    return parseAwards(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

async function saveLocalAwards(awards: ManualTrickAward[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(awards));
  } catch {
    // keep manual trick adding usable if local storage is unavailable
  }
}

async function loadAwards() {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('coach_manual_trick_awards')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) return (data as ManualTrickAwardRow[]).map(awardFromRow);
  }

  return loadLocalAwards();
}

export function useManualTrickAwards() {
  const [awards, setAwards] = useState<ManualTrickAward[]>(cached ?? []);
  const [ready, setReady] = useState(cached !== null);

  useEffect(() => {
    let mounted = true;

    if (cached === null) {
      loadAwards().then((loadedAwards) => {
        if (!mounted) return;
        emit(loadedAwards);
        setAwards(loadedAwards);
        setReady(true);
      });
    } else {
      setReady(true);
    }

    const listener = (nextAwards: ManualTrickAward[]) => setAwards(nextAwards);
    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  const awardManualTrick = async ({ wardId, participantId, participantName, trick }: AwardManualTrickInput) => {
    const existingLocalAward = awards.find((item) => item.trickId === trick.id && (item.wardId === wardId || (participantId && item.participantId === participantId)));
    if (existingLocalAward) return existingLocalAward;

    if (hasSupabaseConfig && supabase) {
      let existingQuery = supabase
        .from('coach_manual_trick_awards')
        .select('*')
        .eq('trick_id', trick.id);

      existingQuery = participantId ? existingQuery.or(`ward_id.eq.${wardId},participant_id.eq.${participantId}`) : existingQuery.eq('ward_id', wardId);

      const { data: existingAward } = await existingQuery.maybeSingle();

      if (existingAward) return awardFromRow(existingAward as ManualTrickAwardRow);
    }

    const coachId = await resolveCurrentCoachId();
    const award: ManualTrickAward = {
      id: `manual-${wardId}-${trick.id}`,
      wardId,
      participantId,
      participantName,
      trickId: trick.id,
      trickTitle: trick.title,
      coachId,
      awardedAt: new Date().toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    const next = [award, ...awards.filter((item) => item.id !== award.id)];

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('coach_manual_trick_awards').upsert(rowFromAward(award), { onConflict: 'id' });
      if (error) await saveLocalAwards(next);
    } else {
      await saveLocalAwards(next);
    }

    emit(next);
    return award;
  };

  return { ready, awards, awardManualTrick };
}