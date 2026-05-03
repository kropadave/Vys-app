import { useEffect, useState } from 'react';

import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { supabase } from '@/lib/supabase';

export type Session = { userId: string } | null;

export function useAuth() {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (DEV_BYPASS_AUTH || !supabase) {
      // V dev mode neresime opravdu prihlaseni - po vyberu role je uzivatel "in".
      setSession({ userId: 'dev-user' });
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ? { userId: data.session.user.id } : null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ? { userId: s.user.id } : null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
