import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

const SHARE_PREF_KEY = 'vys.coachShareLocation';
const STALE_MS = 15 * 60 * 1000; // 15 minutes → considered offline
const REFRESH_MS = 60 * 1000; // re-publish + re-read every minute
const SPOT_RADIUS_M = 300; // a coach is "at a spot" within 300 m

export type CoachLiveLocation = {
  coachId: string;
  coachName: string;
  xp: number;
  lat: number;
  lng: number;
  updatedAt: string;
};

type CoachLiveLocationRow = {
  coach_id: string;
  coach_name: string;
  xp: number | null;
  lat: number;
  lng: number;
  updated_at: string;
};

function rowToLocation(row: CoachLiveLocationRow): CoachLiveLocation {
  return {
    coachId: row.coach_id,
    coachName: row.coach_name,
    xp: Number(row.xp ?? 0),
    lat: row.lat,
    lng: row.lng,
    updatedAt: row.updated_at,
  };
}

// Haversine distance in metres.
export function distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

/**
 * Live coach location sharing for the trénovací-spoty map. A coach opts in and
 * their GPS position is published (name + XP only). All coaches/admins can read
 * everyone's live positions. Stale rows (>15 min) are filtered out client-side.
 */
export function useCoachLiveLocations(enabled: boolean) {
  const { session } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [locations, setLocations] = useState<CoachLiveLocation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const publishTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadLocations = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) return;
    const since = new Date(Date.now() - STALE_MS).toISOString();
    const { data } = await supabase
      .from('coach_live_locations')
      .select('*')
      .gte('updated_at', since);
    if (data) setLocations((data as CoachLiveLocationRow[]).map(rowToLocation));
  }, []);

  const publishOnce = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase || !session?.userId) return false;
    const pos = await getCurrentPosition();
    if (!pos) {
      setError('Nepodařilo se získat polohu. Povol přístup k poloze.');
      return false;
    }
    // Name + XP are denormalized into the row (only data ever shown to others).
    const [{ data: profile }, { data: coachProfile }] = await Promise.all([
      supabase.from('app_profiles').select('name').eq('id', session.userId).maybeSingle(),
      supabase.from('coach_profiles').select('xp').eq('id', session.userId).maybeSingle(),
    ]);
    const { error: upsertError } = await supabase.from('coach_live_locations').upsert(
      {
        coach_id: session.userId,
        coach_name: (profile as { name?: string } | null)?.name ?? 'Trenér',
        xp: Number((coachProfile as { xp?: number } | null)?.xp ?? 0),
        lat: pos.lat,
        lng: pos.lng,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'coach_id' },
    );
    if (upsertError) {
      setError('Sdílení polohy se nezdařilo.');
      return false;
    }
    setError(null);
    return true;
  }, [session?.userId]);

  const stopPublishing = useCallback(async () => {
    if (publishTimer.current) {
      clearInterval(publishTimer.current);
      publishTimer.current = null;
    }
    if (hasSupabaseConfig && supabase && session?.userId) {
      await supabase.from('coach_live_locations').delete().eq('coach_id', session.userId);
    }
  }, [session?.userId]);

  const startSharing = useCallback(async () => {
    setBusy(true);
    const ok = await publishOnce();
    setBusy(false);
    if (!ok) return;
    setSharing(true);
    await AsyncStorage.setItem(SHARE_PREF_KEY, '1');
    await loadLocations();
    if (publishTimer.current) clearInterval(publishTimer.current);
    publishTimer.current = setInterval(() => {
      void publishOnce();
      void loadLocations();
    }, REFRESH_MS);
  }, [publishOnce, loadLocations]);

  const stopSharing = useCallback(async () => {
    setSharing(false);
    await AsyncStorage.setItem(SHARE_PREF_KEY, '0');
    await stopPublishing();
    await loadLocations();
  }, [stopPublishing, loadLocations]);

  const toggleSharing = useCallback(() => {
    if (sharing) void stopSharing();
    else void startSharing();
  }, [sharing, startSharing, stopSharing]);

  // Initial load + restore the saved sharing preference.
  useEffect(() => {
    if (!enabled) return;
    void loadLocations();
    const readInterval = setInterval(() => void loadLocations(), REFRESH_MS);
    let cancelled = false;
    AsyncStorage.getItem(SHARE_PREF_KEY).then((value) => {
      if (!cancelled && value === '1') void startSharing();
    });
    return () => {
      cancelled = true;
      clearInterval(readInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Clean up the publish timer on unmount (does not delete the row so the
  // position survives a screen change; it expires after STALE_MS).
  useEffect(() => () => {
    if (publishTimer.current) clearInterval(publishTimer.current);
  }, []);

  const coachesAtSpot = useCallback(
    (lat: number, lng: number) =>
      locations
        .filter((loc) => loc.coachId !== session?.userId)
        .filter((loc) => distanceMeters(lat, lng, loc.lat, loc.lng) <= SPOT_RADIUS_M)
        .sort((a, b) => b.xp - a.xp),
    [locations, session?.userId],
  );

  return { sharing, locations, busy, error, toggleSharing, coachesAtSpot };
}
