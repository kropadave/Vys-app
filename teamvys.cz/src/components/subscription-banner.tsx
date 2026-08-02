'use client';

import { TriangleAlert } from 'lucide-react';

import { useFeatureFlags } from '@/lib/use-feature-flags';

/**
 * Site-wide banner shown when the signed-in user's organization has a lapsed
 * subscription (past_due / canceled) or is awaiting super admin approval
 * (pending_approval). The VYS org is 'exempt' and never locked.
 */
export function SubscriptionBanner() {
  const { subscriptionLocked, subscriptionStatus } = useFeatureFlags();
  // Only show for genuinely lapsed subscriptions — not for pending_approval
  // (which is the normal state for newly registered orgs awaiting super-admin review).
  if (!subscriptionLocked || subscriptionStatus === 'pending_approval') return null;

  return (
    <div className="sticky top-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 text-center text-sm font-black text-white shadow-md bg-rose-600">
      <TriangleAlert size={16} className="shrink-0" />
      <span>Předplatné vypršelo — obnovte platbu pro plný přístup</span>
    </div>
  );
}
