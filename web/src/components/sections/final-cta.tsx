'use client';

import { ArrowRight, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/animated/reveal';
import { contacts } from '@shared/content';

export function FinalCta() {
  return (
    <section className="section-shell relative my-16 overflow-hidden rounded-brand border border-brand-purple/12 bg-white text-brand-ink shadow-brand-float">
      <div aria-hidden className="cta-gradient-pulse pointer-events-none absolute inset-0" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-brand" />
      <div aria-hidden className="absolute inset-0 diagonal-rails opacity-[0.04]" />

      <div className="relative max-w-[760px] p-7 md:p-10 lg:p-12">
        <Reveal>
          <h2 className="text-3xl font-black leading-tight text-brand-ink md:text-5xl">
            Tvoje parkourová cesta začíná tady.
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="mt-4 max-w-[560px] text-base leading-7 text-brand-ink-soft md:text-lg">
            Jedno kliknutí — a jsi o krok blíž k prvnímu tréninku. My už se na vás těšíme.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            <Link
              href="/krouzky"
              className="flex items-center justify-center gap-2 rounded-[18px] bg-gradient-brand px-5 py-4 text-sm font-black text-white shadow-brand-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand active:scale-95 sm:inline-flex"
            >
              Rezervovat kroužek
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center justify-center gap-2 rounded-[18px] border border-brand-purple/15 bg-brand-paper px-5 py-4 text-sm font-extrabold text-brand-ink transition-colors hover:bg-brand-purple-light active:scale-95 sm:inline-flex"
            >
              Přihlásit se
              <ArrowRight size={18} />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={340}>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-extrabold text-brand-ink-soft">
            <span className="inline-flex items-center gap-2"><Phone size={16} /> {contacts.phone}</span>
            <span className="inline-flex items-center gap-2"><Mail size={16} /> {contacts.email}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
