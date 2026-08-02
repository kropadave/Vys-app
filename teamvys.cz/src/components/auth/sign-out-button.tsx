'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export function SignOutButton({ redirectTo = '/sign-in' }: { redirectTo?: string }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="inline-flex items-center justify-center gap-2 rounded-full border bg-white px-4 py-2.5 text-sm font-black text-brand-ink transition-colors hover:bg-brand-paper"
      style={{ borderColor: 'rgba(20,14,38,0.08)' }}
    >
      <LogOut size={16} />
      Odhlásit
    </button>
  );
}