import { Bell, ChevronRight, Medal, QrCode, Smartphone, Trophy } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { createServerSupabaseClient, hasSupabaseServerConfig } from '@/lib/supabase/server';

type AppSession = { name: string } | { redirectTo: string };

export const metadata = {
  title: 'Účastník',
};

export default async function AppParticipantPage() {
  const session = await getAppSession('participant');
  if ('redirectTo' in session) redirect(session.redirectTo);

  const firstName = session.name.split(' ')[0] || 'Účastníku';

  return (
    <main className="min-h-dvh bg-[#140E26] px-4 py-4 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-32px)] w-full max-w-[760px] flex-col gap-4">
        <header className="rounded-[24px] border border-white/10 bg-white/[0.08] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-lime">Účastnická appka</p>
              <h1 className="mt-1 text-3xl font-black">Ahoj, {firstName}</h1>
            </div>
            <SignOutButton />
          </div>
        </header>

        <section className="rounded-[28px] bg-[#FBFAFE] p-5 text-brand-ink shadow-[0_24px_80px_rgba(0,0,0,0.30)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-purple">Další náramek</p>
              <h2 className="mt-2 text-4xl font-black">920 / 1400 XP</h2>
              <p className="mt-2 text-sm font-bold text-brand-ink-soft">Růžová úroveň, další cíl je fialový náramek.</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-purple-light text-brand-purple">
              <Trophy size={26} />
            </div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-brand-purple-light">
            <div className="h-full w-[66%] rounded-full bg-gradient-brand" />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat icon={QrCode} label="QR triky" value="12" />
          <Stat icon={Smartphone} label="Vstupy" value="7" />
          <Stat icon={Medal} label="Level" value="7" />
        </section>

        <section className="grid gap-3">
          {[
            'Naskenuj QR od trenéra a odemkni další trik.',
            'Další trénink: Středa 16:30 · Vyškov.',
            'Digitální permanentka je připravená na NFC kontrolu.',
          ].map((text) => (
            <div key={text} className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.08] p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-brand-lime text-brand-ink"><Bell size={18} /></span>
              <p className="flex-1 text-sm font-bold leading-6 text-white/78">{text}</p>
              <ChevronRight size={18} className="text-white/42" />
            </div>
          ))}
        </section>

        <Link href="/app/sign-in" className="mt-auto text-center text-xs font-black uppercase tracking-[0.16em] text-white/45">TeamVYS app · jen účastník a trenér</Link>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof QrCode; label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white p-4 text-brand-ink shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
      <Icon size={18} className="text-brand-purple" />
      <p className="mt-3 text-3xl font-black">{value}</p>
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