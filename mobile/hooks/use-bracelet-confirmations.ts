import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const STORAGE_KEY = 'vys.physicalBraceletsConfirmed';

type BraceletConfirmationRow = { ward_id: string };

let cached: string[] | null = null;
const listeners = new Set<(ids: string[]) => void>();

function emit(ids: string[]) {
  cached = ids;
  for (const listener of listeners) listener(ids);
}

function parseIds(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

async function loadLocalConfirmations() {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return parseIds(value);
  } catch {
    return [];
  }
}

async function saveLocalConfirmations(ids: string[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage failures in the prototype
  }
}

export async function loadBraceletConfirmations() {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase.from('bracelet_confirmations').select('ward_id');

    if (!error && data) {
      const ids = (data as BraceletConfirmationRow[]).map((row) => row.ward_id);
      cached = ids;
      return ids;
    }
  }

  try {
    const ids = await loadLocalConfirmations();
    cached = ids;
    return ids;
  } catch {
    return [];
  }
}

export async function confirmPhysicalBracelet(wardId: string) {
  const current = cached ?? await loadBraceletConfirmations();
  const next = Array.from(new Set([...current, wardId]));

  if (hasSupabaseConfig && supabase) {
    const { error } = await supabase.from('bracelet_confirmations').upsert({ ward_id: wardId });

    if (error) await saveLocalConfirmations(next);
  } else {
    await saveLocalConfirmations(next);
  }

  emit(next);
}

export function useBraceletConfirmations() {
  const [confirmedIds, setConfirmedIds] = useState<string[]>(cached ?? []);
  const [ready, setReady] = useState(cached !== null);

  useEffect(() => {
    let mounted = true;

    if (cached === null) {
      loadBraceletConfirmations().then((ids) => {
        if (!mounted) return;
        setConfirmedIds(ids);
        setReady(true);
      });
    } else {
      setReady(true);
    }

    const listener = (ids: string[]) => setConfirmedIds(ids);
    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { confirmedIds, ready, confirmPhysicalBracelet };
}