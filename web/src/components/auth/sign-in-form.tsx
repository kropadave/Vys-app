'use client';

import { LogIn, UserPlus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { createBrowserSupabaseClient, hasSupabaseBrowserConfig } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';

type WebRole = 'parent' | 'admin';
type Mode = 'sign-in' | 'sign-up';

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [mode, setMode] = useState<Mode>('sign-in');
  const [role, setRole] = useState<WebRole>('parent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const configReady = DEV_BYPASS_AUTH || hasSupabaseBrowserConfig();
  const submitLabel = useMemo(() => (DEV_BYPASS_AUTH ? 'Otevřít testovací sekci' : mode === 'sign-in' ? 'Přihlásit se' : 'Vytvořit účet'), [mode]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (DEV_BYPASS_AUTH) {
      const redirectTo = next && next.startsWith('/') && !next.startsWith('//') ? next : role === 'admin' ? '/admin' : '/rodic';
      router.replace(redirectTo);
      router.refresh();
      return;
    }

    if (!configReady) {
      setMessage('Doplň NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY ve web/.env.local.');
      return;
    }

    if (password.length < 6) {
      setMessage('Heslo musí mít alespoň 6 znaků.');
      return;
    }

    setPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const authResult =
        mode === 'sign-in'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { data: { role, name: name || email } },
            });

      if (authResult.error) throw authResult.error;

      const user = authResult.data.user;
      if (!user) {
        setMessage('Zkontroluj e-mail a potvrď registraci.');
        return;
      }

      await supabase.from('app_profiles').upsert(
        {
          id: user.id,
          role,
          name: name || user.email || 'TeamVYS uživatel',
          email: user.email,
        },
        { onConflict: 'id' }
      );

      const redirectTo = next && next.startsWith('/') && !next.startsWith('//') ? next : role === 'admin' ? '/admin' : '/rodic';
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Přihlášení se nepovedlo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-brand border border-black/10 bg-white p-6 shadow-brand md:p-7"
    >
      <div className="grid grid-cols-2 gap-2 rounded-brand bg-brand-paper p-1">
        <button
          type="button"
          onClick={() => setMode('sign-in')}
          className={cn('rounded-brand px-4 py-3 text-sm font-black transition-colors', mode === 'sign-in' ? 'bg-white text-brand-ink shadow-brand-soft' : 'text-slate-600')}
        >
          Přihlášení
        </button>
        <button
          type="button"
          onClick={() => setMode('sign-up')}
          className={cn('rounded-brand px-4 py-3 text-sm font-black transition-colors', mode === 'sign-up' ? 'bg-white text-brand-ink shadow-brand-soft' : 'text-slate-600')}
        >
          Registrace
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <RoleButton active={role === 'parent'} label="Rodič" onClick={() => setRole('parent')} />
        <RoleButton active={role === 'admin'} label="Admin" onClick={() => setRole('admin')} />
      </div>

      {mode === 'sign-up' ? (
        <label className="block space-y-2">
          <span className="text-xs font-black uppercase text-slate-500">Jméno</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-brand border border-black/10 bg-white px-4 py-3 text-brand-ink outline-none focus:border-brand-cyan"
            placeholder="Tvoje jméno"
          />
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-xs font-black uppercase text-slate-500">E-mail</span>
        <input
          type="email"
          required={!DEV_BYPASS_AUTH}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-brand border border-black/10 bg-white px-4 py-3 text-brand-ink outline-none focus:border-brand-cyan"
          placeholder="rodic@email.cz"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-xs font-black uppercase text-slate-500">Heslo</span>
        <input
          type="password"
          required={!DEV_BYPASS_AUTH}
          minLength={DEV_BYPASS_AUTH ? undefined : 6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-brand border border-black/10 bg-white px-4 py-3 text-brand-ink outline-none focus:border-brand-cyan"
          placeholder="Alespoň 6 znaků"
        />
      </label>

      {message ? <p className="rounded-brand bg-brand-paper p-3 text-sm font-bold text-slate-600">{message}</p> : null}

      <button
        type="submit"
        disabled={pending || !configReady}
        className="inline-flex w-full items-center justify-center gap-2 rounded-brand bg-gradient-brand px-6 py-4 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {mode === 'sign-in' ? <LogIn size={18} /> : <UserPlus size={18} />}
        {pending ? 'Pracuji…' : submitLabel}
      </button>

      {DEV_BYPASS_AUTH ? (
        <p className="text-xs leading-5 text-slate-500">
          Testovací režim je zapnutý, proto můžeš pokračovat bez e-mailu, hesla a Supabase konfigurace.
        </p>
      ) : !configReady ? (
        <p className="text-xs leading-5 text-slate-500">
          Supabase web env není vyplněný. Formulář je připravený, po doplnění hodnot začne fungovat bez další změny kódu.
        </p>
      ) : null}
    </form>
  );
}

function RoleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-brand border px-4 py-3 text-sm font-black transition-colors',
        active ? 'border-brand-purple bg-brand-purple-light text-brand-ink' : 'border-black/10 bg-white text-slate-600 hover:text-brand-ink'
      )}
    >
      {label}
    </button>
  );
}