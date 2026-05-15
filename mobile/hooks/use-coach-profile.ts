import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';

import {
    type CoachProfileOverride,
    mergeCoachProfileOverrides,
    type PublicCoachProfile,
} from '@/lib/course-coaches';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const STORAGE_KEY = 'vys.coachProfileOverrides';

type CoachProfileRow = {
  id: string;
  profile_photo_url: string | null;
  qr_tricks_approved: number | null;
  assigned_courses: string[] | null;
  bank_account: string | null;
  iban: string | null;
  payout_account_holder: string | null;
  payout_note: string | null;
};

export type CoachPayoutDetails = {
  bankAccount: string;
  iban: string;
  payoutAccountHolder: string;
  payoutNote: string;
};

type AppProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
};

let cached: CoachProfileOverride[] | null = null;
const listeners = new Set<(overrides: CoachProfileOverride[]) => void>();

function emit(overrides: CoachProfileOverride[]) {
  cached = overrides;
  for (const listener of listeners) listener(overrides);
}

function parseOverrides(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is CoachProfileOverride => typeof item?.id === 'string') : [];
  } catch {
    return [];
  }
}

async function loadLocalOverrides() {
  try {
    return parseOverrides(await AsyncStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

async function saveLocalOverrides(overrides: CoachProfileOverride[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // Local persistence is enough to keep the prototype usable without Supabase storage.
  }
}

function mergeOverrides(primary: CoachProfileOverride[], fallback: CoachProfileOverride[]) {
  const seen = new Set(primary.map((item) => item.id));
  return [...primary, ...fallback.filter((item) => !seen.has(item.id))];
}

async function loadSupabaseOverrides() {
  if (!hasSupabaseConfig || !supabase) return [];

  const { data, error } = await supabase
    .from('coach_profiles')
    .select('id, profile_photo_url, qr_tricks_approved, assigned_courses, bank_account, iban, payout_account_holder, payout_note');

  if (error || !data) return [];

  const ids = (data as CoachProfileRow[]).map((row) => row.id);
  const { data: appProfiles } = ids.length > 0
    ? await supabase.from('app_profiles').select('id, name, email, phone, bio').in('id', ids)
    : { data: [] };
  const appProfileById = new Map((appProfiles as AppProfileRow[] | null ?? []).map((profile) => [profile.id, profile]));

  return (data as CoachProfileRow[]).map((row) => ({
    id: row.id,
    name: appProfileById.get(row.id)?.name ?? undefined,
    email: appProfileById.get(row.id)?.email ?? undefined,
    phone: appProfileById.get(row.id)?.phone ?? undefined,
    bio: appProfileById.get(row.id)?.bio ?? undefined,
    profilePhotoUri: row.profile_photo_url ?? undefined,
    bankAccount: row.bank_account ?? undefined,
    iban: row.iban ?? undefined,
    payoutAccountHolder: row.payout_account_holder ?? undefined,
    payoutNote: row.payout_note ?? undefined,
    taughtTricksCount: typeof row.qr_tricks_approved === 'number' ? row.qr_tricks_approved : undefined,
    assignedCourseIds: row.assigned_courses ?? undefined,
  }));
}

async function loadOverrides() {
  const [localOverrides, supabaseOverrides] = await Promise.all([loadLocalOverrides(), loadSupabaseOverrides()]);
  const overrides = mergeOverrides(localOverrides, supabaseOverrides);
  cached = overrides;
  return overrides;
}

export function useCoachProfiles() {
  const [overrides, setOverrides] = useState<CoachProfileOverride[]>(cached ?? []);
  const [ready, setReady] = useState(cached !== null);
  const coaches = useMemo(() => mergeCoachProfileOverrides(overrides), [overrides]);

  useEffect(() => {
    let mounted = true;

    if (cached === null) {
      loadOverrides().then((loadedOverrides) => {
        if (!mounted) return;
        setOverrides(loadedOverrides);
        setReady(true);
      });
    } else {
      setReady(true);
    }

    const listener = (nextOverrides: CoachProfileOverride[]) => setOverrides(nextOverrides);
    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  const saveCoachProfilePhoto = async (coachId: string, profilePhotoUri: string) => {
    const current = cached ?? overrides;
    const next = [
      { id: coachId, profilePhotoUri },
      ...current.filter((item) => item.id !== coachId),
    ];

    await saveLocalOverrides(next);

    if (hasSupabaseConfig && supabase) {
      await supabase.from('coach_profiles').update({ profile_photo_url: profilePhotoUri }).eq('id', coachId);
    }

    emit(next);
  };

  const saveCoachPayoutDetails = async (coachId: string, details: CoachPayoutDetails) => {
    const override = {
      id: coachId,
      bankAccount: details.bankAccount.trim() || undefined,
      iban: details.iban.replace(/\s+/g, '').toUpperCase() || undefined,
      payoutAccountHolder: details.payoutAccountHolder.trim() || undefined,
      payoutNote: details.payoutNote.trim() || undefined,
    };
    const current = cached ?? overrides;
    const previous = current.find((item) => item.id === coachId);
    const next = [
      { ...previous, ...override },
      ...current.filter((item) => item.id !== coachId),
    ];

    await saveLocalOverrides(next);

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.rpc('teamvys_update_coach_payout_details', {
        p_bank_account: override.bankAccount ?? null,
        p_iban: override.iban ?? null,
        p_payout_account_holder: override.payoutAccountHolder ?? null,
        p_payout_note: override.payoutNote ?? null,
      });
      if (error) throw error;
    }

    emit(next);
  };

  const saveCoachPhone = async (coachId: string, phone: string) => {
    const trimmed = phone.trim() || undefined;
    const current = cached ?? overrides;
    const previous = current.find((item) => item.id === coachId);
    const next = [
      { ...previous, id: coachId, phone: trimmed },
      ...current.filter((item) => item.id !== coachId),
    ];

    await saveLocalOverrides(next);

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase
        .from('app_profiles')
        .update({ phone: trimmed ?? null })
        .eq('id', coachId);
      if (error) throw error;
    }

    emit(next);
  };

  return { coaches, ready, saveCoachProfilePhoto, saveCoachPayoutDetails, saveCoachPhone };
}

export function useCoachProfile(coachId = 'coach-demo') {
  const { coaches, ready, saveCoachProfilePhoto, saveCoachPayoutDetails, saveCoachPhone } = useCoachProfiles();
  const coach = coaches.find((item) => item.id === coachId) ?? emptyCoachProfile(coachId);

  return { coach, ready, saveCoachProfilePhoto, saveCoachPayoutDetails, saveCoachPhone };
}

function emptyCoachProfile(coachId: string): PublicCoachProfile {
  return {
    id: coachId,
    name: 'TeamVYS trenér',
    email: '',
    phone: '',
    bio: 'Trenérský profil TeamVYS.',
    taughtTricksCount: 0,
    assignedCourseIds: [],
  };
}