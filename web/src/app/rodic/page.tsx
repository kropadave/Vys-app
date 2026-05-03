import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SignOutButton } from '@/components/auth/sign-out-button';
import { ParentPortalDashboard } from '@/components/portal/parent-dashboard';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { parentProfile } from '@/lib/portal-content';
import { createServerSupabaseClient, hasSupabaseServerConfig } from '@/lib/supabase/server';

export const metadata = {
  title: 'Rodič',
};

export default async function ParentDashboardPage() {
  let displayName = 'Test rodič';
  let displayEmail = parentProfile.email;
  let showSignOut = false;

  if (!DEV_BYPASS_AUTH) {
    if (!hasSupabaseServerConfig()) return <ConfigMissing />;

    const supabase = await createServerSupabaseClient();
    const { data: userResult } = await supabase.auth.getUser();
    const user = userResult.user;
    if (!user) redirect('/sign-in?next=/rodic');

    const { data: profile } = await supabase.from('app_profiles').select('role,name,email').eq('id', user.id).maybeSingle();
    displayName = profile?.name || user.email || 'Rodič';
    displayEmail = profile?.email || user.email || parentProfile.email;
    showSignOut = true;
  }

  return (
    <main className="min-h-dvh bg-brand-paper px-4 py-6 text-brand-ink texture-grid md:px-6 md:py-8">
      <div className="mx-auto max-w-[1220px] space-y-6">
        <header className="overflow-hidden rounded-brand border border-brand-purple/12 bg-white shadow-brand">
          <div className="h-1.5 bg-gradient-brand" />
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-7">
            <div className="max-w-[720px]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-pink">Rodičovský web</p>
              <h1 className="mt-2 text-3xl font-black leading-tight text-brand-ink md:text-5xl">Ahoj, {displayName}</h1>
              <p className="mt-2 text-sm font-bold leading-6 text-brand-ink-soft md:text-base">Přehled účastníků, plateb, dokumentů a docházky rozdělený do jednodušších sekcí.</p>
              {DEV_BYPASS_AUTH ? <p className="mt-2 text-xs font-black uppercase text-brand-purple">Testovací režim bez přihlášení</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/" className="rounded-brand border border-brand-purple/12 bg-brand-paper px-4 py-2.5 text-sm font-black text-brand-ink transition-colors hover:bg-brand-purple-light">Web</Link>
              {showSignOut ? <SignOutButton /> : null}
            </div>
          </div>
        </header>

        <ParentPortalDashboard displayName={displayName} displayEmail={displayEmail} />
      </div>
    </main>
  );
}

function ConfigMissing() {
  return (
    <main className="min-h-dvh bg-brand-paper px-6 py-12">
      <div className="mx-auto max-w-[760px] rounded-brand-lg border bg-white p-7" style={{ borderColor: 'rgba(20,14,38,0.08)', boxShadow: 'var(--shadow-card)' }}>
        <p className="text-brand-pink text-xs font-black uppercase tracking-[0.16em]">Chybí Supabase env</p>
        <h1 className="text-3xl font-black text-brand-ink mt-2">Doplň webové Supabase klíče</h1>
        <p className="text-[#5C5474] leading-7 mt-3">Pro přihlášení je potřeba vyplnit NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY ve web/.env.local.</p>
      </div>
    </main>
  );
}