import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Falešná session pro DEV režim, abychom obešli přihlašování při testování UI.
const MOCK_SESSION = {
  access_token: 'dev-mock-token',
  refresh_token: 'dev-mock-refresh',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: {
    id: 'mock-participant-1',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'dev@teamvys.local',
    app_metadata: {},
    user_metadata: { dev: true },
    created_at: new Date().toISOString(),
  },
} as unknown as Session;

export function useAuth() {
  const [session, setSession] = useState<Session | null>(
    DEV_BYPASS_AUTH ? MOCK_SESSION : null,
  );
  const [loading, setLoading] = useState(!DEV_BYPASS_AUTH);

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}
