import { redirect } from 'next/navigation';

import { SuperAdminOrganizations } from '@/components/admin/super-admin-organizations';
import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { createServerSupabaseClient, hasSupabaseServerConfig } from '@/lib/supabase/server';

export const metadata = {
  title: 'Organizace · Super admin',
};

export const dynamic = 'force-dynamic';

export default async function SuperAdminOrganizationsPage() {
  if (!DEV_BYPASS_AUTH) {
    if (!hasSupabaseServerConfig()) {
      return (
        <main className="grid min-h-dvh place-items-center bg-brand-paper px-4 text-brand-ink">
          <p className="text-sm font-bold text-brand-ink-soft">Chybí konfigurace Supabase (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).</p>
        </main>
      );
    }

    const supabase = await createServerSupabaseClient();
    const { data: userResult } = await supabase.auth.getUser();
    const user = userResult.user;
    if (!user) redirect('/sign-in?next=/admin/organizace');

    const { data: profile } = await supabase.from('app_profiles').select('role,super_admin').eq('id', user.id).maybeSingle();
    if (profile?.super_admin !== true) redirect(profile?.role === 'admin' ? '/admin' : '/rodic');
  }

  return (
    <main className="min-h-dvh bg-brand-paper px-4 py-6 text-brand-ink texture-grid md:px-6 md:py-8">
      <div className="mx-auto max-w-[1280px]">
        <SuperAdminOrganizations />
      </div>
    </main>
  );
}
