'use client';

import { useEffect, useState } from 'react';

import { createBrowserSupabaseClient, hasSupabaseBrowserConfig } from '@/lib/supabase/browser';
import { type FeatureFlags, parseFeatureFlags, VYS_FEATURE_FLAGS } from '@shared/feature-flags';

export { EXTERNAL_FEATURE_FLAGS, VYS_FEATURE_FLAGS, VYS_ORG_ID } from '@shared/feature-flags';
export type { FeatureFlagKey, FeatureFlags, OrgType } from '@shared/feature-flags';

type FlagsState = { flags: FeatureFlags; orgId: string | null; subscriptionStatus: string | null; subscriptionLocked: boolean; loaded: boolean };

const LOCKED_SUBSCRIPTION_STATUSES = new Set(['pending_approval', 'past_due', 'canceled']);

// Module-level cache so every component shares one fetch per page load.
let cached: FlagsState | null = null;
let inFlight: Promise<FlagsState> | null = null;
const listeners = new Set<(state: FlagsState) => void>();

function emit(state: FlagsState) {
  cached = state;
  for (const listener of listeners) listener(state);
}

async function fetchFlags(): Promise<FlagsState> {
  // Public visitors and unconfigured environments see the VYS experience.
  const fallback: FlagsState = { flags: VYS_FEATURE_FLAGS, orgId: null, subscriptionStatus: null, subscriptionLocked: false, loaded: true };
  if (!hasSupabaseBrowserConfig()) return fallback;

  const supabase = createBrowserSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return fallback;

  const { data, error } = await supabase
    .from('app_profiles')
    .select('org_id, organizations(org_type, feature_flags, subscription_status)')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return fallback;

  const org = Array.isArray(data.organizations) ? data.organizations[0] : data.organizations;
  const subscriptionStatus = (org?.subscription_status as string | null) ?? null;
  return {
    flags: parseFeatureFlags(org?.feature_flags, org?.org_type),
    orgId: (data.org_id as string | null) ?? null,
    subscriptionStatus,
    subscriptionLocked: subscriptionStatus !== null && LOCKED_SUBSCRIPTION_STATUSES.has(subscriptionStatus),
    loaded: true,
  };
}

export function refreshFeatureFlags(): Promise<FlagsState> {
  if (!inFlight) {
    inFlight = fetchFlags()
      .then((state) => {
        emit(state);
        return state;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/**
 * Reads organizations.feature_flags for the signed-in user's org.
 * Anonymous visitors (public web) get the full VYS flag set.
 * `flag('participant_spots_map')`-style checks: `flags.participant_spots_map`.
 */
export function useFeatureFlags(): FlagsState {
  const [state, setState] = useState<FlagsState>(
    cached ?? { flags: VYS_FEATURE_FLAGS, orgId: null, subscriptionStatus: null, subscriptionLocked: false, loaded: false },
  );

  useEffect(() => {
    listeners.add(setState);
    if (cached) setState(cached);
    else void refreshFeatureFlags();

    if (!hasSupabaseBrowserConfig()) return () => { listeners.delete(setState); };

    const supabase = createBrowserSupabaseClient();
    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      cached = null;
      void refreshFeatureFlags();
    });

    return () => {
      listeners.delete(setState);
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}
