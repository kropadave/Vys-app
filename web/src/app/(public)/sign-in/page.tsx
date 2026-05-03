import { CreditCard, Gauge, ShieldCheck } from 'lucide-react';
import { Suspense } from 'react';

import { SignInForm } from '@/components/auth/sign-in-form';

export const metadata = {
  title: 'Přihlášení',
  description: 'Přihlášení rodiče nebo admina do webu TeamVYS přes Supabase Auth.',
};

export default function SignInPage() {
  return (
    <section className="section-shell grid gap-6 py-12 md:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div className="rounded-brand border border-brand-purple/12 bg-white p-7 text-brand-ink shadow-brand-float md:p-8">
        <span className="inline-flex rounded-brand bg-brand-purple-light px-3 py-2 text-xs font-black uppercase text-brand-purple-deep">
          Web profil
        </span>
        <h1 className="mt-5 text-3xl font-black leading-tight md:text-5xl">Přihlášení pro rodiče a admina</h1>
        <p className="mt-4 max-w-[620px] text-base leading-7 text-brand-ink-soft md:text-lg">
          Rodič pokračuje k platbě, dokumentům a přehledu dítěte. Admin se dostane do zjednodušeného webového přehledu plateb a backend stavů.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Info icon={<CreditCard size={19} />} title="Platby" body="Rezervace a Stripe checkout." />
          <Info icon={<ShieldCheck size={19} />} title="Dokumenty" body="Příprava pro kroužky a tábory." />
          <Info icon={<Gauge size={19} />} title="Admin" body="Finance a provozní kontrola." />
        </div>
      </div>

      <Suspense fallback={<div className="rounded-brand border border-black/10 bg-white p-7 shadow-brand-soft">Načítám přihlášení…</div>}>
        <SignInForm />
      </Suspense>
    </section>
  );
}

function Info({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-brand bg-brand-paper p-4">
      <span className="text-brand-pink">{icon}</span>
      <h2 className="mt-3 font-black text-brand-ink">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-brand-ink-soft">{body}</p>
    </div>
  );
}