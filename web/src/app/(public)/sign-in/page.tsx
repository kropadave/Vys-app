import { Gauge } from 'lucide-react';
import { Suspense } from 'react';

import { SignInForm } from '@/components/auth/sign-in-form';

export const metadata = {
  title: 'Přihlášení',
  description: 'Přihlášení admina do webu TeamVYS.',
};

export default function SignInPage() {
  return (
    <section className="section-shell grid gap-6 py-10 md:py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <div className="rounded-[28px] border border-brand-purple/12 bg-white p-6 text-brand-ink shadow-brand-float md:p-8">
        <span className="inline-flex rounded-[16px] bg-brand-purple-light px-3 py-2 text-xs font-black uppercase text-brand-purple-deep">
          Web profil
        </span>
        <h1 className="mt-5 text-3xl font-black leading-tight md:text-5xl">Přihlášení admina</h1>
        <p className="mt-4 max-w-[620px] text-base leading-7 text-brand-ink-soft md:text-lg">
          Webový portál je pouze pro administrátory. Správa přihlášek, plateb a backend stavů.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-1">
          <Info icon={<Gauge size={19} />} title="Admin" body="Finance, plány a provozní kontrola." />
        </div>

        {/* Parent redirect notice */}
        <div className="mt-6 rounded-[18px] border border-brand-purple/20 bg-brand-purple-light p-5">
          <p className="text-sm font-black text-brand-purple-deep">Jsi rodič?</p>
          <p className="mt-1 text-sm leading-6 text-brand-ink-soft">
            Přihlášení rodičů je nyní v mobilní aplikaci <strong>TeamVYS</strong>. Staž si ji na App Store nebo Google Play.
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="rounded-[28px] border border-brand-purple/12 bg-white p-7 shadow-brand-soft">Načítám přihlášení…</div>}>
        <SignInForm />
      </Suspense>
    </section>
  );
}

function Info({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-[18px] bg-brand-paper p-4">
      <span className="text-brand-purple">{icon}</span>
      <h2 className="mt-3 font-black text-brand-ink">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-brand-ink-soft">{body}</p>
    </div>
  );
}