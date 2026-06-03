'use client';

import { Eye, EyeOff, KeyRound, LogIn, MailCheck, UserPlus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { createBrowserSupabaseClient, hasSupabaseBrowserConfig } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';

type WebRole = 'parent' | 'admin';
type Mode = 'sign-in' | 'sign-up' | 'verify-email' | 'forgot-password' | 'reset-password';

type AuthUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-ZÁ-Ž]/.test(password) && /[a-zá-ž]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-zÁ-Žá-ž0-9]/.test(password)) score += 1;
  return score;
}

function passwordStrengthLabel(score: number) {
  if (score >= 4) return 'Silné heslo';
  if (score >= 3) return 'Dobré heslo';
  if (score >= 2) return 'Použitelné heslo';
  return 'Slabé heslo';
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [mode, setMode] = useState<Mode>('sign-in');
  const [role, setRole] = useState<WebRole>('parent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const configReady = DEV_BYPASS_AUTH || hasSupabaseBrowserConfig();
  const strength = passwordStrength(password);
  const submitLabel = useMemo(() => {
    if (DEV_BYPASS_AUTH) return 'Otevřít testovací sekci';
    if (mode === 'verify-email') return 'Ověřit e-mail';
    if (mode === 'forgot-password') return 'Poslat obnovovací e-mail';
    if (mode === 'reset-password') return 'Uložit nové heslo';
    return mode === 'sign-in' ? 'Přihlásit se' : 'Vytvořit účet';
  }, [mode]);

  useEffect(() => {
    if (searchParams.get('mode') === 'reset-password') setMode('reset-password');
  }, [searchParams]);

  useEffect(() => {
    if (DEV_BYPASS_AUTH || !hasSupabaseBrowserConfig()) return;

    const supabase = createBrowserSupabaseClient();
    const code = searchParams.get('code');
    const isPasswordRecovery = searchParams.get('mode') === 'reset-password';

    if (code) {
      setPending(true);
      supabase.auth.exchangeCodeForSession(code).then(async ({ data: authData, error }) => {
        if (error) {
          setMessage(error.message);
          return;
        }

        if (isPasswordRecovery) {
          setMode('reset-password');
          router.replace('/sign-in?mode=reset-password');
          return;
        }

        const user = authData.user ?? authData.session?.user;
        if (!user) {
          setMessage('Odkaz se otevřel, ale účet se nepodařilo načíst. Zkus se přihlásit e-mailem a heslem.');
          return;
        }

        const { data: profile, error: profileError } = await supabase.from('app_profiles').select('role').eq('id', user.id).maybeSingle();
        if (profileError) throw profileError;

        if (profile?.role === 'admin' || profile?.role === 'parent') {
          router.replace(redirectForRole(profile.role));
          router.refresh();
          return;
        }

        await upsertParentProfile(supabase, user, metadataName(user) || name);
        router.replace(redirectForRole('parent'));
        router.refresh();
      }).catch((error) => {
        setMessage(error instanceof Error ? error.message : 'Ověření e-mailu se nepovedlo.');
      }).finally(() => {
        setPending(false);
      });
    }

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('reset-password');
    });

    return () => data.subscription.unsubscribe();
  }, [router, searchParams]);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage(null);
    setPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    if (nextMode === 'sign-up' && role === 'admin' && !DEV_BYPASS_AUTH) setRole('parent');
  }

  function redirectForRole(resolvedRole: WebRole) {
    return next && next.startsWith('/') && !next.startsWith('//') ? next : resolvedRole === 'admin' ? '/admin' : '/rodic';
  }

  function emailRedirectUrl() {
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '';
    const params = new URLSearchParams();
    if (safeNext) params.set('next', safeNext);
    const query = params.toString();
    return `${window.location.origin}/sign-in${query ? `?${query}` : ''}`;
  }

  async function verifyEmailCode() {
    const normalizedEmail = email.trim().toLowerCase();
    const token = verificationCode.trim().replace(/\s+/g, '');

    if (!normalizedEmail) {
      setMessage('Vyplň e-mail, na který jsme poslali ověřovací kód.');
      return;
    }

    if (!token) {
      setMessage('Vyplň ověřovací kód z e-mailu.');
      return;
    }

    setPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token, type: 'signup' });
      if (error) throw error;

      const user = data.user ?? data.session?.user;
      if (!user) throw new Error('Kód se nepodařilo přiřadit k účtu.');

      await upsertParentProfile(supabase, user, name);
      router.replace(redirectForRole('parent'));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ověření kódu se nepovedlo.');
    } finally {
      setPending(false);
    }
  }

  async function resendVerificationEmail() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage('Nejdřív vyplň e-mail.');
      return;
    }

    setPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: { emailRedirectTo: emailRedirectUrl() },
      });
      if (error) throw error;
      setMode('verify-email');
      setMessage('Ověřovací e-mail je poslaný znovu. Zadej kód, nebo otevři odkaz v e-mailu.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ověřovací e-mail se nepodařilo poslat znovu.');
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (DEV_BYPASS_AUTH) {
      router.replace(redirectForRole(role));
      router.refresh();
      return;
    }

    if (!configReady) {
      setMessage('Doplň NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY ve web/.env.local.');
      return;
    }

    if (mode === 'verify-email') {
      await verifyEmailCode();
      return;
    }

    if (mode === 'forgot-password') {
      if (!email.trim()) {
        setMessage('Vyplň e-mail, kam pošleme obnovu hesla.');
        return;
      }

      setPending(true);
      try {
        const supabase = createBrowserSupabaseClient();
        const redirectTo = `${window.location.origin}/sign-in?mode=reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
        if (error) throw error;
        setMessage('Obnovovací e-mail je odeslaný. Otevři odkaz a nastav nové heslo.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Obnovu hesla se nepodařilo odeslat.');
      } finally {
        setPending(false);
      }
      return;
    }

    if (password.length < 6) {
      setMessage('Heslo musí mít alespoň 6 znaků.');
      return;
    }

    if ((mode === 'sign-up' || mode === 'reset-password') && password !== confirmPassword) {
      setMessage('Hesla se neshodují.');
      return;
    }

    if (mode !== 'sign-in' && passwordStrength(password) < 2) {
      setMessage('Použij silnější heslo: ideálně 8 znaků, číslo a kombinaci malých/velkých písmen.');
      return;
    }

    if (mode === 'reset-password') {
      setPending(true);
      try {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await supabase.auth.signOut();
        setPassword('');
        setConfirmPassword('');
        setMode('sign-in');
        setMessage('Heslo je změněné. Teď se můžeš přihlásit novým heslem.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Nové heslo se nepodařilo uložit.');
      } finally {
        setPending(false);
      }
      return;
    }

    if (mode === 'sign-up' && role === 'admin') {
      setMessage('Admin účet nejde vytvořit veřejnou registrací. Přihlášení admina musí nejdřív povolit existující admin.');
      return;
    }

    setPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const authResult =
        mode === 'sign-in'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email: email.trim().toLowerCase(),
              password,
              options: {
                emailRedirectTo: emailRedirectUrl(),
                data: { role: 'parent', name: name.trim() || email.trim().toLowerCase() },
              },
            });

      if (authResult.error) throw authResult.error;

      const user = authResult.data.user;
      if (!user) {
        setMode('verify-email');
        setMessage('Zkontroluj e-mail. Poslali jsme ověřovací kód i odkaz pro dokončení registrace.');
        return;
      }

      if (mode === 'sign-up' && !authResult.data.session) {
        setMode('verify-email');
        setMessage('Registrace je založená. Zadej ověřovací kód z e-mailu, nebo otevři potvrzovací odkaz.');
        return;
      }

      if (mode === 'sign-in') {
        const { data: profile, error } = await supabase.from('app_profiles').select('role').eq('id', user.id).maybeSingle();
        if (error) throw error;

        if (profile?.role === 'admin' || profile?.role === 'parent') {
          // Enforce that selected role matches actual DB role
          if (profile.role !== role) {
            await supabase.auth.signOut();
            const roleName = profile.role === 'admin' ? 'Admin' : 'Rodič';
            setMessage(`Tenhle účet je ${roleName}. Vyber správnou roli a zkus to znovu.`);
            setRole(profile.role as WebRole);
            return;
          }
          router.replace(redirectForRole(profile.role));
          router.refresh();
          return;
        }

        if (!profile && role === 'parent') {
          await supabase.from('app_profiles').upsert(
            { id: user.id, role: 'parent', name: name || user.email || 'TeamVYS rodič', email: user.email },
            { onConflict: 'id' }
          );
          router.replace(redirectForRole('parent'));
          router.refresh();
          return;
        }

        await supabase.auth.signOut();
        setMessage('Tenhle účet není webový rodič ani schválený admin. Použij správné přihlášení.');
        return;
      }

      await upsertParentProfile(supabase, user, name);

      router.replace(redirectForRole('parent'));
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Přihlášení se nepovedlo.';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setMode('verify-email');
        setMessage('E-mail ještě není ověřený. Zadej kód z ověřovacího e-mailu, nebo si ho pošli znovu.');
      } else {
        setMessage(msg);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-[28px] border border-brand-purple/12 bg-white p-6 shadow-brand md:p-7"
    >
      <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-brand-paper p-1.5">
        <button
          type="button"
          onClick={() => switchMode('sign-in')}
          className={cn('rounded-[16px] px-4 py-3 text-sm font-black transition-colors', mode === 'sign-in' ? 'bg-white text-brand-ink shadow-brand-soft' : 'text-brand-ink-soft')}
        >
          Přihlášení
        </button>
        <button
          type="button"
          onClick={() => switchMode('sign-up')}
          className={cn('rounded-[16px] px-4 py-3 text-sm font-black transition-colors', mode === 'sign-up' ? 'bg-white text-brand-ink shadow-brand-soft' : 'text-brand-ink-soft')}
        >
          Registrace
        </button>
      </div>

      {mode === 'verify-email' || mode === 'forgot-password' || mode === 'reset-password' ? (
        <div className="rounded-[18px] border border-brand-purple/12 bg-brand-paper p-4">
          <p className="text-sm font-black text-brand-ink">{mode === 'verify-email' ? 'Ověření e-mailu' : mode === 'forgot-password' ? 'Obnova hesla' : 'Nové heslo'}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-brand-ink-soft">
            {mode === 'verify-email'
              ? 'Zadej kód z e-mailu. Když e-mail obsahuje jen odkaz, otevři ho a web účet ověří automaticky.'
              : mode === 'forgot-password'
              ? 'Pošleme bezpečný odkaz na e-mail účtu. Odkaz nastavíš v Supabase Auth.'
              : 'Zadej nové heslo po otevření odkazu ze Supabase e-mailu.'}
          </p>
        </div>
      ) : null}

      {mode === 'sign-in' || mode === 'sign-up' ? <div className="grid grid-cols-2 gap-2">
        <RoleButton active={role === 'parent'} label="Rodič" onClick={() => setRole('parent')} />
        {mode === 'sign-in' || DEV_BYPASS_AUTH ? <RoleButton active={role === 'admin'} label="Admin" onClick={() => setRole('admin')} /> : null}
      </div> : null}

      {mode === 'sign-up' ? (
        <label className="block space-y-2">
          <span className="text-xs font-black uppercase text-brand-ink-soft">Jméno *</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-[16px] border border-brand-purple/12 bg-white px-4 py-3 text-brand-ink outline-none transition focus:border-brand-purple"
            placeholder="Tvoje jméno a příjmení"
          />
        </label>
      ) : null}

      <label className="block space-y-2">
        <span className="text-xs font-black uppercase text-brand-ink-soft">E-mail</span>
        <input
          type="email"
          required={!DEV_BYPASS_AUTH}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-[16px] border border-brand-purple/12 bg-white px-4 py-3 text-brand-ink outline-none transition focus:border-brand-purple"
          placeholder="rodic@email.cz"
        />
      </label>

      {mode === 'verify-email' ? (
        <label className="block space-y-2">
          <span className="text-xs font-black uppercase text-brand-ink-soft">Ověřovací kód</span>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={verificationCode}
            onChange={(event) => setVerificationCode(event.target.value)}
            className="w-full rounded-[16px] border border-brand-purple/12 bg-white px-4 py-3 text-brand-ink outline-none transition focus:border-brand-purple"
            placeholder="Kód z e-mailu"
          />
        </label>
      ) : null}

      {mode !== 'forgot-password' && mode !== 'verify-email' ? (
        <>
          <PasswordField
            label={mode === 'reset-password' ? 'Nové heslo' : 'Heslo'}
            value={password}
            onChange={setPassword}
            visible={showPassword}
            onToggle={() => setShowPassword((value) => !value)}
          />

          {mode === 'sign-up' || mode === 'reset-password' ? (
            <>
              <div className="space-y-2">
                <div className="h-2 overflow-hidden rounded-full bg-brand-paper">
                  <div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${Math.max(strength, 1) * 25}%` }} />
                </div>
                <p className="text-xs font-bold text-brand-ink-soft">{passwordStrengthLabel(strength)}</p>
              </div>
              <PasswordField
                label="Potvrzení hesla"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((value) => !value)}
              />
            </>
          ) : null}
        </>
      ) : null}

      {message ? <p className="rounded-[16px] bg-brand-paper p-3 text-sm font-bold text-brand-ink-soft">{message}</p> : null}

      <button
        type="submit"
        disabled={pending || !configReady}
        className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-brand px-6 py-4 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {mode === 'forgot-password' || mode === 'verify-email' ? <MailCheck size={18} /> : mode === 'reset-password' ? <KeyRound size={18} /> : mode === 'sign-in' ? <LogIn size={18} /> : <UserPlus size={18} />}
        {pending ? 'Pracuji…' : submitLabel}
      </button>

      {!DEV_BYPASS_AUTH && configReady ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black text-brand-purple">
          {mode === 'sign-in' ? <button type="button" onClick={() => switchMode('forgot-password')} className="hover:text-brand-pink">Zapomenuté heslo</button> : null}
          {mode === 'verify-email' ? <button type="button" onClick={resendVerificationEmail} disabled={pending} className="hover:text-brand-pink disabled:opacity-55">Poslat kód znovu</button> : null}
          {mode === 'verify-email' || mode === 'forgot-password' || mode === 'reset-password' ? <button type="button" onClick={() => switchMode('sign-in')} className="hover:text-brand-pink">Zpět na přihlášení</button> : null}
        </div>
      ) : null}

      {DEV_BYPASS_AUTH ? (
        <p className="text-xs leading-5 text-brand-ink-soft">
          Testovací režim je zapnutý, proto můžeš pokračovat bez e-mailu, hesla a Supabase konfigurace.
        </p>
      ) : !configReady ? (
        <p className="text-xs leading-5 text-brand-ink-soft">
          Supabase web env není vyplněný. Formulář je připravený, po doplnění hodnot začne fungovat bez další změny kódu.
        </p>
      ) : null}
    </form>
  );
}

async function upsertParentProfile(supabase: ReturnType<typeof createBrowserSupabaseClient>, user: AuthUser, fallbackName: string) {
  const resolvedName = cleanDisplayName(fallbackName) || metadataName(user) || nameFromEmail(user.email) || 'TeamVYS rodič';
  const { error } = await supabase.from('app_profiles').upsert(
    {
      id: user.id,
      role: 'parent',
      name: resolvedName,
      email: user.email,
    },
    { onConflict: 'id' }
  );

  if (error) throw error;
}

function metadataName(user: AuthUser) {
  const metadata = user.user_metadata ?? {};
  const value = typeof metadata.name === 'string' ? metadata.name : typeof metadata.full_name === 'string' ? metadata.full_name : '';
  return cleanDisplayName(value);
}

function cleanDisplayName(value: string) {
  return value.trim();
}

function nameFromEmail(email?: string | null) {
  const prefix = email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  return prefix ? prefix.replace(/\b\w/g, (letter) => letter.toUpperCase()) : '';
}

function PasswordField({ label, value, onChange, visible, onToggle }: { label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-black uppercase text-brand-ink-soft">{label}</span>
      <span className="flex rounded-[16px] border border-brand-purple/12 bg-white transition focus-within:border-brand-purple">
        <input
          type={visible ? 'text' : 'password'}
          required={!DEV_BYPASS_AUTH}
          minLength={DEV_BYPASS_AUTH ? undefined : 6}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 rounded-[16px] bg-transparent px-4 py-3 text-brand-ink outline-none"
          placeholder="Alespoň 6 znaků"
        />
        <button type="button" onClick={onToggle} className="flex w-12 items-center justify-center text-brand-ink-soft hover:text-brand-ink" aria-label={visible ? 'Skrýt heslo' : 'Zobrazit heslo'}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

function RoleButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[18px] border px-4 py-3 text-sm font-black transition-colors',
        active ? 'border-brand-purple bg-brand-purple-light text-brand-ink' : 'border-brand-purple/12 bg-white text-brand-ink-soft hover:text-brand-ink'
      )}
    >
      {label}
    </button>
  );
}