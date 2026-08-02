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

/**
 * Seed the module-level cache from a server-rendered fetch.
 * Used by the admin dashboard where the org's flags are loaded server-side
 * (service-role, bypasses any RLS embed issues) and must not fall back to the
 * VYS defaults that the client-side `fetchFlags` returns when the embed fails.
 */
export function seedFeatureFlags(flags: FeatureFlags, orgId: string | null, subscriptionStatus: string | null) {
  const next: FlagsState = {
    flags,
    orgId,
    subscriptionStatus,
    subscriptionLocked: subscriptionStatus !== null && LOCKED_SUBSCRIPTION_STATUSES.has(subscriptionStatus),
    loaded: true,
  };
  emit(next);
}

async function fetchFlags(): Promise<FlagsState> {
  // Public visitors and unconfigured environments see the VYS experience.
  const fallback: FlagsState = { flags: VYS_FEATURE_FLAGS, orgId: null, subscriptionStatus: null, subscriptionLocked: false, loaded: true };
  if (!hasSupabaseBrowserConfig()) return fallback;

  const supabase = createBrowserSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return fallback;

  // Read the profile's org_id first, then load the org row directly. We avoid a
  // PostgREST embed (`organizations(...)`) because RLS on the embedded resource
  // can return null even when a direct read is allowed, which would silently
  // fall back to the VYS flag set (showing workshops to external orgs).
  const { data: profileRow, error: profileError } = await supabase
    .from('app_profiles')
    .select('org_id')
    .eq('id', userId)
    .maybeSingle();
  if (profileError || !profileRow) return fallback;

  const orgId = (profileRow.org_id as string | null) ?? null;
  if (!orgId) return fallback;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('org_type, feature_flags, subscription_status')
    .eq('id', orgId)
    .maybeSingle();
  if (orgError || !org) return fallback;

  const subscriptionStatus = (org.subscription_status as string | null) ?? null;
  return {
    flags: parseFeatureFlags(org.feature_flags, org.org_type as string | null | undefined),
    orgId,
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
