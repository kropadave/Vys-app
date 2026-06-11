'use client';

import { ArrowLeft, Building2, CircleCheck, CircleX, Loader2, RefreshCw, Users, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { createBrowserSupabaseClient, hasSupabaseBrowserConfig } from '@/lib/supabase/browser';

type OverviewOrganization = {
  id: string;
  name: string;
  orgType: 'vys' | 'external';
  sportType: string | null;
  city: string | null;
  contactEmail: string | null;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  nextPaymentAt: string | null;
  coachCount: number;
  participantCount: number;
  createdAt: string;
};

type OverviewTotals = {
  orgCount: number;
  activeCount: number;
  trialingCount: number;
  pastDueCount: number;
  monthlyRevenueCzk: number;
};

type OverviewResponse = {
  organizations: OverviewOrganization[];
  totals: OverviewTotals;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  exempt: { label: 'VYS · bez poplatku', className: 'bg-brand-purple/10 text-brand-purple' },
  active: { label: 'Aktivní', className: 'bg-emerald-50 text-emerald-700' },
  trialing: { label: 'Zkušební období', className: 'bg-sky-50 text-sky-700' },
  past_due: { label: 'Po splatnosti', className: 'bg-amber-50 text-amber-700' },
  canceled: { label: 'Zrušeno', className: 'bg-rose-50 text-rose-700' },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, className: 'bg-neutral-100 text-neutral-600' };
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

async function callOverviewFunction(body?: Record<string, unknown>): Promise<Response> {
  const supabase = createBrowserSupabaseClient();
  const { data: sessionResult } = await supabase.auth.getSession();
  const token = sessionResult.session?.access_token;
  if (!token) throw new Error('Přihlášení vypršelo. Přihlas se prosím znovu.');

  const functionsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/organizations-overview`;
  return fetch(functionsUrl, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export function SuperAdminOrganizations() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingOrgId, setPendingOrgId] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    if (!hasSupabaseBrowserConfig()) {
      setError('Chybí konfigurace Supabase.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await callOverviewFunction();
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Přehled organizací se nepodařilo načíst.');
      setData(payload as OverviewResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Přehled organizací se nepodařilo načíst.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function setStatus(orgId: string, subscriptionStatus: 'active' | 'canceled') {
    setPendingOrgId(orgId);
    setError(null);
    try {
      const response = await callOverviewFunction({ action: 'set_status', orgId, subscriptionStatus });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'Změna stavu organizace selhala.');
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Změna stavu organizace selhala.');
    } finally {
      setPendingOrgId(null);
    }
  }

  const totals = data?.totals;

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-brand-purple/10 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-brand-purple/10 text-brand-purple">
              <Building2 size={20} />
            </span>
            <div>
              <h1 className="text-lg font-black text-brand-ink">Organizace na platformě</h1>
              <p className="text-xs font-bold text-brand-ink-soft">super admin · předplatná, trialy a velikost klubů</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-[14px] border border-brand-purple/15 bg-white px-3 py-2 text-xs font-black text-brand-ink-soft transition hover:text-brand-purple">
              <ArrowLeft size={15} />
              Zpět do adminu
            </Link>
            <button type="button" onClick={() => void loadOverview()} disabled={loading} className="inline-flex items-center gap-2 rounded-[14px] bg-brand-purple px-3 py-2 text-xs font-black text-white transition hover:bg-brand-purple/90 disabled:opacity-60">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Obnovit
            </button>
          </div>
        </div>

        {totals ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <OverviewMetric icon={<Building2 size={16} />} label="Organizace" value={String(totals.orgCount)} />
            <OverviewMetric icon={<CircleCheck size={16} />} label="Aktivní předplatné" value={String(totals.activeCount)} />
            <OverviewMetric icon={<Users size={16} />} label="Ve zkušebním období" value={String(totals.trialingCount)} />
            <OverviewMetric icon={<CircleX size={16} />} label="Po splatnosti" value={String(totals.pastDueCount)} />
            <OverviewMetric icon={<WalletCards size={16} />} label="Měsíční příjem" value={`${totals.monthlyRevenueCzk.toLocaleString('cs-CZ')} Kč`} />
          </div>
        ) : null}
      </section>

      {error ? <p className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}

      <section className="overflow-hidden rounded-[24px] border border-brand-purple/10 bg-white shadow-sm">
        {loading && !data ? (
          <div className="grid place-items-center gap-2 p-10 text-brand-ink-soft">
            <Loader2 size={22} className="animate-spin text-brand-purple" />
            <p className="text-xs font-black">Načítám přehled organizací…</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-brand-purple/10 bg-brand-paper text-[11px] font-black uppercase tracking-wide text-brand-ink-soft">
                  <th className="px-4 py-3">Organizace</th>
                  <th className="px-4 py-3">Sport · město</th>
                  <th className="px-4 py-3">Stav</th>
                  <th className="px-4 py-3">Trial končí</th>
                  <th className="px-4 py-3">Další platba</th>
                  <th className="px-4 py-3 text-center">Trenéři</th>
                  <th className="px-4 py-3 text-center">Účastníci</th>
                  <th className="px-4 py-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody>
                {(data?.organizations ?? []).map((org) => {
                  const meta = statusMeta(org.subscriptionStatus);
                  const isExempt = org.subscriptionStatus === 'exempt';
                  const pending = pendingOrgId === org.id;
                  return (
                    <tr key={org.id} className="border-b border-brand-purple/5 last:border-b-0">
                      <td className="px-4 py-3">
                        <p className="font-black text-brand-ink">{org.name}</p>
                        <p className="text-xs text-brand-ink-soft">{org.contactEmail ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-brand-ink-soft">
                        {[org.sportType, org.city].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${meta.className}`}>{meta.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-brand-ink-soft">{formatDate(org.trialEndsAt)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-brand-ink-soft">{formatDate(org.nextPaymentAt)}</td>
                      <td className="px-4 py-3 text-center font-black text-brand-ink">{org.coachCount}</td>
                      <td className="px-4 py-3 text-center font-black text-brand-ink">{org.participantCount}</td>
                      <td className="px-4 py-3">
                        {isExempt ? (
                          <p className="text-right text-xs font-bold text-brand-ink-soft">—</p>
                        ) : (
                          <div className="flex justify-end gap-2">
                            {org.subscriptionStatus !== 'active' ? (
                              <button type="button" disabled={pending} onClick={() => void setStatus(org.id, 'active')} className="inline-flex items-center gap-1 rounded-[12px] bg-emerald-600 px-3 py-1.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-60">
                                {pending ? <Loader2 size={13} className="animate-spin" /> : <CircleCheck size={13} />}
                                Aktivovat
                              </button>
                            ) : null}
                            {org.subscriptionStatus !== 'canceled' ? (
                              <button type="button" disabled={pending} onClick={() => void setStatus(org.id, 'canceled')} className="inline-flex items-center gap-1 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-60">
                                {pending ? <Loader2 size={13} className="animate-spin" /> : <CircleX size={13} />}
                                Zrušit
                              </button>
                            ) : null}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {data && data.organizations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm font-bold text-brand-ink-soft">Zatím žádné organizace.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function OverviewMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-brand-purple/10 bg-brand-paper px-4 py-3">
      <div className="flex items-center gap-2 text-brand-purple">{icon}<span className="text-[11px] font-black uppercase tracking-wide text-brand-ink-soft">{label}</span></div>
      <p className="mt-1 text-xl font-black text-brand-ink">{value}</p>
    </div>
  );
}
