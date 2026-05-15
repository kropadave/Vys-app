import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export type AppRole = 'participant' | 'coach';

const STORAGE_KEY = 'vys.role';

let cached: AppRole | null = null;
const listeners = new Set<(role: AppRole | null) => void>();

function emit(role: AppRole | null) {
  cached = role;
  for (const l of listeners) l(role);
}

function parseRole(value: string | null): AppRole | null {
  if (value === 'participant' || value === 'coach') return value;
  if (value === 'kid') return 'participant';
  return null;
}

export async function loadInitialRole(): Promise<AppRole | null> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    const role = parseRole(value);
    cached = role;
    return role;
  } catch {
    return null;
  }
}

export async function setRole(role: AppRole | null, options: { remember?: boolean } = {}) {
  const remember = options.remember ?? true;
  try {
    if (role && remember) await AsyncStorage.setItem(STORAGE_KEY, role);
    else await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  emit(role);
}

export function useRole() {
  const [role, setRoleState] = useState<AppRole | null>(cached);
  const [ready, setReady] = useState(cached !== null);

  useEffect(() => {
    let mounted = true;
    if (cached === null) {
      loadInitialRole().then((r) => {
        if (!mounted) return;
        setRoleState(r);
        setReady(true);
      });
    } else {
      setReady(true);
    }
    const listener = (r: AppRole | null) => setRoleState(r);
    listeners.add(listener);
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { role, ready, setRole };
}
