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
  if (!subscriptionLocked) return null;

  const pendingApproval = subscriptionStatus === 'pending_approval';

  return (
    <div className={`sticky top-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 text-center text-sm font-black text-white shadow-md ${pendingApproval ? 'bg-amber-600' : 'bg-rose-600'}`}>
      <TriangleAlert size={16} className="shrink-0" />
      <span>
        {pendingApproval
          ? 'Organizace čeká na schválení správcem platformy — dáme vám vědět e-mailem'
          : 'Předplatné vypršelo — obnovte platbu pro plný přístup'}
      </span>
    </div>
  );
}
