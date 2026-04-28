/**
 * Globální role aplikace: rodič, účastník nebo trenér.
 * Persistujeme v AsyncStorage. Změna se rozesílá přes jednoduchý subscribe.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type AppRole = 'parent' | 'participant' | 'coach';
const STORAGE_KEY = 'vys.role';

let _role: AppRole = 'participant';
const listeners = new Set<(r: AppRole) => void>();

function parseRole(value: string | null): AppRole | null {
  if (value === 'parent' || value === 'participant' || value === 'coach') return value;
  if (value === 'kid') return 'participant';
  return null;
}

export async function loadInitialRole(): Promise<AppRole> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = parseRole(v);
    if (parsed) _role = parsed;
  } catch {
    // ignore
  }
  return _role;
}

export function getRole(): AppRole {
  return _role;
}

export async function setRole(role: AppRole): Promise<void> {
  _role = role;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, role);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l(role));
}

export function useRole(): { role: AppRole; setRole: (r: AppRole) => Promise<void>; ready: boolean } {
  const [role, setLocal] = useState<AppRole>(_role);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadInitialRole().then((r) => {
      if (!mounted) return;
      setLocal(r);
      setReady(true);
    });
    const sub = (r: AppRole) => setLocal(r);
    listeners.add(sub);
    return () => {
      mounted = false;
      listeners.delete(sub);
    };
  }, []);

  return { role, setRole, ready };
}
