'use client';

import { Check, LogIn, Send, UserPlus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';

import { DEV_BYPASS_AUTH } from '@/lib/dev-config';
import { createBrowserSupabaseClient, hasSupabaseBrowserConfig } from '@/lib/supabase/browser';
import { cn } from '@/lib/utils';

type AppRole = 'participant' | 'coach';
type AuthMode = 'sign-in' | 'sign-up';
type FormField = 'email' | 'password' | 'confirmPassword' | 'name' | 'phone' | 'birthDate' | 'coachMessage';

const roleOptions: Array<{ role: AppRole; title: string; subtitle: string; route: string }> = [
  { role: 'participant', title: 'Účastník', subtitle: 'XP, náramky, QR triky', route: '/app/ucastnik' },
  { role: 'coach', title: 'Trenér', subtitle: 'Docházka, QR, přehled práce', route: '/app/trener' },
];

const emptyForm: Record<FormField, string> = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
  birthDate: '',
  coachMessage: '',
};

function routeForRole(role: AppRole) {
  return roleOptions.find((option) => option.role === role)?.route ?? '/app/ucastnik';
}

export function AppSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [role, setRole] = useState<AppRole>('participant');
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const configReady = DEV_BYPASS_AUTH || hasSupabaseBrowserConfig();
  const selectedRole = roleOptions.find((option) => option.role === role) ?? roleOptions[0];
  const submitLabel = useMemo(() => {
    if (mode === 'sign-up' && role === 'coach') return 'Odeslat žádost o přístup';
    if (mode === 'sign-up') return 'Vytvořit účet účastníka';
    return `Přihlásit se jako ${selectedRole.title.toLowerCase()}`;
  }, [mode, role, selectedRole.title]);

  function updateField(field: FormField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  function safeNext(fallbackRole: AppRole) {
    const fallback = routeForRole(fallbackRole);
    if (!next || !next.startsWith('/app/') || next.startsWith('//')) return fallback;
    return next;
  }

  function validate() {
    if (!configReady) return 'Doplň NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY.';
    if (DEV_BYPASS_AUTH) return null;
    if (!form.email.trim()) return 'Vyplň e-mail.';
    if (form.password.length < 6) return 'Heslo musí mít alespoň 6 znaků.';
    if (mode === 'sign-up' && form.password !== form.confirmPassword) return 'Hesla se neshodují.';
    if (mode === 'sign-up' && !form.name.trim()) return 'Vyplň jméno.';
    return null;
  }

  async function upsertAppProfile(userId: string, email: string | null, resolvedRole: AppRole) {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from('app_profiles').upsert(
      {
        id: userId,
        role: resolvedRole,
        name: form.name.trim() || email || (resolvedRole === 'coach' ? 'Trenér TeamVYS' : 'Účastník TeamVYS'),
        email,
        phone: form.phone.trim() || null,
        bio: resolvedRole === 'coach' ? form.coachMessage.trim() || null : null,
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
  }

  async function upsertRoleProfile(userId: string, resolvedRole: AppRole) {
    const supabase = createBrowserSupabaseClient();

    if (resolvedRole === 'coach') {
      const { error } = await supabase.from('coach_profiles').upsert(
        {
          id: userId,
          level: 1,
          xp: 0,
          next_level_xp: 500,
          qr_tricks_approved: 0,
          attendance_logged: 0,
          bonus_total: 0,
          assigned_courses: [],
        },
        { onConflict: 'id' }
      );
      if (error) throw error;
      return;
    }

    const [firstName, ...restName] = form.name.trim().split(/\s+/).filter(Boolean);
    const { error } = await supabase.from('participants').upsert(
      {
        id: userId,
        first_name: firstName || 'Účastník',
        last_name: restName.join(' ') || 'TeamVYS',
        date_of_birth: form.birthDate.trim() || null,
        parent_phone: form.phone.trim() || null,
        without_phone: !form.phone.trim(),
        paid_status: 'due',
        active_purchases: [],
      },
      { onConflict: 'id' }
    );
    if (error) throw error;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const validationMessage = validate();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    if (DEV_BYPASS_AUTH) {
      router.replace(safeNext(role));
      router.refresh();
      return;
    }

    setPending(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const authResult =
        mode === 'sign-in'
          ? await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
          : await supabase.auth.signUp({
              email: form.email.trim(),
              password: form.password,
              options: { data: { role, name: form.name.trim(), phone: form.phone.trim() } },
            });

      if (authResult.error) throw authResult.error;

      const user = authResult.data.user;
      if (!user) {
        setMessage('Zkontroluj e-mail a potvrď registraci.');
        return;
      }

      let resolvedRole = role;
      if (mode === 'sign-in') {
        const { data: profile, error } = await supabase.from('app_profiles').select('role').eq('id', user.id).maybeSingle();
        if (error) throw error;

        if (profile?.role === 'participant' || profile?.role === 'coach') {
          resolvedRole = profile.role;
        } else {
          await supabase.auth.signOut();
          setMessage('Tento účet patří do webového profilu. Rodič a admin pokračují přes běžný web TeamVYS.');
          return;
        }
      } else {
        await upsertAppProfile(user.id, user.email ?? form.email.trim(), role);
        await upsertRoleProfile(user.id, role);
      }

      router.replace(safeNext(resolvedRole));
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Přihlášení se nepovedlo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-2 gap-2 rounded-[18px] bg-brand-paper p-1">
        <button type="button" onClick={() => setMode('sign-in')} className={cn('rounded-[14px] px-4 py-3 text-sm font-black transition-colors', mode === 'sign-in' ? 'bg-white text-brand-ink shadow-brand-soft' : 'text-brand-ink-soft')}>Přihlášení</button>
        <button type="button" onClick={() => setMode('sign-up')} className={cn('rounded-[14px] px-4 py-3 text-sm font-black transition-colors', mode === 'sign-up' ? 'bg-white text-brand-ink shadow-brand-soft' : 'text-brand-ink-soft')}>Registrace</button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {roleOptions.map((option) => {
          const active = role === option.role;
          return (
            <button key={option.role} type="button" onClick={() => setRole(option.role)} className={cn('rounded-[18px] border p-4 text-left transition-colors', active ? 'border-brand-purple bg-brand-purple-light' : 'border-brand-purple/12 bg-white hover:bg-brand-paper')}>
              <span className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-base font-black text-brand-ink">{option.title}</span>
                  <span className="mt-1 block text-xs font-bold text-brand-ink-soft">{option.subtitle}</span>
                </span>
                {active ? <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-brand text-white"><Check size={16} strokeWidth={3} /></span> : null}
              </span>
            </button>
          );
        })}
      </div>

      {mode === 'sign-up' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jméno" value={form.name} onChange={(value) => updateField('name', value)} placeholder={role === 'coach' ? 'Filip Trenér' : 'Eliška Nováková'} />
          <Field label={role === 'coach' ? 'Telefon' : 'Telefon rodiče'} value={form.phone} onChange={(value) => updateField('phone', value)} placeholder="+420 605 324 417" />
          {role === 'participant' ? <Field label="Datum narození" value={form.birthDate} onChange={(value) => updateField('birthDate', value)} placeholder="12. 4. 2014" /> : null}
          {role === 'coach' ? <Field label="Krátce o sobě" value={form.coachMessage} onChange={(value) => updateField('coachMessage', value)} placeholder="Město, zkušenosti, dostupnost" multiline /> : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="E-mail" type="email" value={form.email} onChange={(value) => updateField('email', value)} placeholder={role === 'coach' ? 'trener@teamvys.cz' : 'ucastnik@email.cz'} />
        <Field label="Heslo" type="password" value={form.password} onChange={(value) => updateField('password', value)} placeholder="Alespoň 6 znaků" />
        {mode === 'sign-up' ? <Field label="Potvrzení hesla" type="password" value={form.confirmPassword} onChange={(value) => updateField('confirmPassword', value)} placeholder="Zopakuj heslo" /> : null}
      </div>

      {message ? <p className="rounded-[16px] bg-brand-paper p-3 text-sm font-bold leading-6 text-brand-ink-soft">{message}</p> : null}

      <button type="submit" disabled={pending || !configReady} className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-brand px-6 py-4 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55">
        {mode === 'sign-in' ? <LogIn size={18} /> : role === 'coach' ? <Send size={18} /> : <UserPlus size={18} />}
        {pending ? 'Pracuji...' : submitLabel}
      </button>

      {DEV_BYPASS_AUTH ? <p className="text-xs font-bold leading-5 text-brand-ink-soft">Testovací režim je zapnutý, takže appka pustí vybranou roli bez e-mailu a hesla.</p> : null}
    </form>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', multiline = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; multiline?: boolean }) {
  return (
    <label className={cn('block space-y-2', multiline ? 'sm:col-span-2' : '')}>
      <span className="text-xs font-black uppercase text-brand-ink-soft">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-[104px] w-full resize-none rounded-[16px] border border-brand-purple/12 bg-white px-4 py-3 text-brand-ink outline-none transition-colors focus:border-brand-cyan" placeholder={placeholder} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-[16px] border border-brand-purple/12 bg-white px-4 py-3 text-brand-ink outline-none transition-colors focus:border-brand-cyan" placeholder={placeholder} />
      )}
    </label>
  );
}