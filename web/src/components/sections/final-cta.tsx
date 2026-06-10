'use client';

import { ArrowRight, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/animated/reveal';
import { contacts } from '@shared/content';

export function FinalCta() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#080412' }}>
      <div aria-hidden className="absolute inset-x-0 top-0 z-20 h-[2px] bg-white" />
      {/* Glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[5%] top-[-5%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(139,29,255,0.25)_0%,transparent_70%)]" />
        <div className="absolute right-[-10%] bottom-0 h-[40vh] w-[50vh] rounded-full bg-[radial-gradient(circle,rgba(241,43,179,0.15)_0%,transparent_70%)]" />
      </div>
      <div aria-hidden className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:radial-gradient(ellipse_70%_60%_at_30%_50%,black,transparent)]" />

      <div className="section-shell relative py-32 md:py-40">
        <Reveal>
          <h2 className="max-w-[16ch] text-[clamp(2.6rem,6vw,5.5rem)] font-black leading-[0.92] tracking-[-0.04em] text-white">
            Tvoje parkourová cesta{' '}
            <span className="gradient-text">začíná tady.</span>
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/krouzky"
              className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-black text-brand-purple-deep transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.18)] active:scale-95"
            >
              Rezervovat kroužek
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/8 px-8 py-4 text-sm font-black text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/14 active:scale-95"
            >
              Přihlásit se
              <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-semibold text-white/35">
            <span className="inline-flex items-center gap-2"><Phone size={15} /> {contacts.phone}</span>
            <span className="inline-flex items-center gap-2"><Mail size={15} /> {contacts.email}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}


