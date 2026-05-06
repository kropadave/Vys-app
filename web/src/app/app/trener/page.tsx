import { CalendarDays, CheckCircle2, Clock, QrCode, WalletCards } from 'lucide-react';
import { redirect } from 'next/navigation';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { createServerSupabaseClient, hasSupabaseServerConfig } from '@/lib/supabase/server';

type AppSession = { name: string } | { redirectTo: string };

export const metadata = {
  title: 'Trenér',
};

const todaySessions = [
  { time: '16:30', place: 'Vyškov · ZŠ Nádražní', group: 'Začátečníci', present: '18 / 22' },
  { time: '18:00', place: 'Vyškov · ZŠ Nádražní', group: 'Pokročilí', present: '14 / 18' },
];

export default async function AppCoachPage() {
  const session = await getAppSession('coach');
  if ('redirectTo' in session) redirect(session.redirectTo);

  return (
    <main className="min-h-dvh bg-[#140E26] px-4 py-4 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-32px)] w-full max-w-[860px] flex-col gap-4">
        <header className="rounded-[24px] border border-white/10 bg-white/[0.08] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-lime">Trenérská appka</p>
              <h1 className="mt-1 text-3xl font-black">Ahoj, {session.name}</h1>
            </div>
            <SignOutButton />
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat icon={CheckCircle2} label="Docházka" value="32" />
          <Stat icon={QrCode} label="QR potvrzení" value="18" />
          <Stat icon={WalletCards} label="Výplata" value="8 400 Kč" />
        </section>

        <section className="rounded-[28px] bg-[#FBFAFE] p-5 text-brand-ink shadow-[0_24px_80px_rgba(0,0,0,0.30)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-brand-purple-light text-brand-purple"><CalendarDays size={22} /></span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Dnešní tréninky</p>
              <h2 className="text-2xl font-black">Docházka a skupiny</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {todaySessions.map((sessionItem) => (
              <article key={`${sessionItem.time}-${sessionItem.group}`} className="rounded-[20px] border border-brand-purple/12 bg-white p-4 shadow-brand-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-brand-ink">{sessionItem.group}</p>
                    <p className="mt-1 text-xs font-bold text-brand-ink-soft">{sessionItem.place}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-[14px] bg-brand-paper px-3 py-2 text-xs font-black text-brand-ink">
                    <Clock size={14} /> {sessionItem.time}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase text-brand-ink-soft">Přítomnost</span>
                  <span className="text-sm font-black text-brand-purple">{sessionItem.present}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <p className="mt-auto text-center text-xs font-black uppercase tracking-[0.16em] text-white/45">TeamVYS app · jen účastník a trenér</p>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof CheckCircle2; label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white p-4 text-brand-ink shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <Icon size={18} className="text-brand-purple" />
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase text-brand-ink-soft">{label}</p>
    </div>
  );
}

async function getAppSession(requiredRole: 'participant' | 'coach'): Promise<AppSession> {
  if (DEV_BYPASS_AUTH) return { name: requiredRole === 'coach' ? 'Filip Trenér' : 'Eliška Nováková' };
  if (!hasSupabaseServerConfig()) return { redirectTo: '/app/sign-in' };

  const supabase = await createServerSupabaseClient();
  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) return { redirectTo: `/app/sign-in?next=/app/${requiredRole === 'coach' ? 'trener' : 'ucastnik'}` };

  const { data: profile } = await supabase.from('app_profiles').select('role,name,email').eq('id', user.id).maybeSingle();
  if (profile?.role !== requiredRole) return { redirectTo: profile?.role === 'coach' ? '/app/trener' : profile?.role === 'participant' ? '/app/ucastnik' : '/sign-in' };

  return { name: profile.name || user.email || 'TeamVYS' };
}