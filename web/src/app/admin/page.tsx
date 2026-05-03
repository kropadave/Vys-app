import { redirect } from 'next/navigation';

import { AdminDashboard, type AdminFinanceResponse } from '@/components/admin/admin-dashboard';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { createServerSupabaseClient, hasSupabaseServerConfig } from '@/lib/supabase/server';

export const metadata = {
  title: 'Admin',
};

export default async function AdminPage() {
  let showSignOut = false;

  if (!DEV_BYPASS_AUTH) {
    if (!hasSupabaseServerConfig()) return <ConfigMissing />;

    const supabase = await createServerSupabaseClient();
    const { data: userResult } = await supabase.auth.getUser();
    const user = userResult.user;
    if (!user) redirect('/sign-in?next=/admin');

    const { data: profile } = await supabase.from('app_profiles').select('role,name,email').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') redirect('/rodic');
    showSignOut = true;
  }

  const finance = await loadFinance();

  return (
    <main className="min-h-dvh bg-brand-paper px-4 py-6 text-brand-ink texture-grid md:px-6 md:py-8">
      <div className="mx-auto max-w-[1280px]">
        <AdminDashboard finance={finance.data} financeError={finance.error} showSignOut={showSignOut} devMode={DEV_BYPASS_AUTH} />
      </div>
    </main>
  );
}

async function loadFinance(): Promise<{ data: AdminFinanceResponse | null; error: string | null }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/admin/finance`, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return { data: null, error: payload.error || `HTTP ${response.status}` };
    return { data: payload, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Backend není dostupný.' };
  }
}

function ConfigMissing() {
  return (
    <main className="min-h-dvh bg-brand-paper px-6 py-12">
      <div className="mx-auto max-w-[760px] rounded-brand-lg border bg-white p-7" style={{ borderColor: 'rgba(20,14,38,0.08)', boxShadow: 'var(--shadow-card)' }}>
        <p className="text-brand-pink text-xs font-black uppercase tracking-[0.16em]">Chybí Supabase env</p>
        <h1 className="text-3xl font-black text-brand-ink mt-2">Doplň webové Supabase klíče</h1>
        <p className="text-[#5C5474] leading-7 mt-3">Admin stránka potřebuje NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY ve web/.env.local.</p>
      </div>
    </main>
  );
}