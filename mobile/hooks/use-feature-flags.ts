import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { type FeatureFlags, parseFeatureFlags, VYS_FEATURE_FLAGS } from '@/lib/feature-flags';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';

export { EXTERNAL_FEATURE_FLAGS, VYS_FEATURE_FLAGS, VYS_ORG_ID } from '@/lib/feature-flags';
export type { FeatureFlagKey, FeatureFlags, OrgType } from '@/lib/feature-flags';

const STORAGE_KEY = 'vys.featureFlags';

type FlagsState = { flags: FeatureFlags; orgId: string | null; subscriptionStatus: string | null; subscriptionLocked: boolean; loaded: boolean };

const LOCKED_SUBSCRIPTION_STATUSES = new Set(['pending_approval', 'past_due', 'canceled']);

let cached: FlagsState | null = null;
let inFlight: Promise<void> | null = null;
const listeners = new Set<(state: FlagsState) => void>();

function emit(state: FlagsState) {
  cached = state;
  for (const listener of listeners) listener(state);
}

async function loadStoredFlags(): Promise<FlagsState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { flags?: unknown; orgId?: string | null; orgType?: string | null; subscriptionStatus?: string | null };
    const subscriptionStatus = parsed.subscriptionStatus ?? null;
    return {
      flags: parseFeatureFlags(parsed.flags, parsed.orgType ?? undefined),
      orgId: parsed.orgId ?? null,
      subscriptionStatus,
      subscriptionLocked: subscriptionStatus !== null && LOCKED_SUBSCRIPTION_STATUSES.has(subscriptionStatus),
      loaded: true,
    };
  } catch {
    return null;
  }
}

async function persistFlags(state: FlagsState) {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ flags: state.flags, orgId: state.orgId, orgType: state.flags.org_type, subscriptionStatus: state.subscriptionStatus }),
    );
  } catch {
    // ignore
  }
}

async function fetchFlags(): Promise<void> {
  // Demo mode / signed-out users see the full VYS experience.
  const fallback: FlagsState = { flags: VYS_FEATURE_FLAGS, orgId: null, subscriptionStatus: null, subscriptionLocked: false, loaded: true };

  if (!hasSupabaseConfig || !supabase) {
    emit(fallback);
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    emit(fallback);
    return;
  }

  const { data, error } = await supabase
    .from('app_profiles')
    .select('org_id, organizations(org_type, feature_flags, subscription_status)')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) {
    // Keep whatever we already have (stored cache) over downgrading on a network blip.
    if (!cached?.loaded) emit(fallback);
    return;
  }

  const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  const subscriptionStatus = (org?.subscription_status as string | null) ?? null;
  const state: FlagsState = {
    flags: parseFeatureFlags(org?.feature_flags, org?.org_type),
    orgId: (data.org_id as string | null) ?? null,
    subscriptionStatus,
    subscriptionLocked: subscriptionStatus !== null && LOCKED_SUBSCRIPTION_STATUSES.has(subscriptionStatus),
    loaded: true,
  };
  emit(state);
  void persistFlags(state);
}

export function refreshFeatureFlags(): Promise<void> {
  if (!inFlight) {
    inFlight = fetchFlags().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/**
 * Reads organizations.feature_flags for the signed-in user's org.
 * Demo mode and signed-out users get the full VYS flag set.
 * Usage: `const { flags } = useFeatureFlags(); if (flags.trainer_camps) ...`
 */
export function useFeatureFlags(): FlagsState {
  const [state, setState] = useState<FlagsState>(
    cached ?? { flags: VYS_FEATURE_FLAGS, orgId: null, subscriptionStatus: null, subscriptionLocked: false, loaded: false },
  );

  useEffect(() => {
    listeners.add(setState);

    if (cached) {
      setState(cached);
    } else {
      void loadStoredFlags().then((stored) => {
        if (stored && !cached) emit(stored);
        void refreshFeatureFlags();
      });
    }

    const subscription = supabase?.auth.onAuthStateChange(() => {
      cached = null;
      void refreshFeatureFlags();
    });

    return () => {
      listeners.delete(setState);
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  return state;
}
