'use client';

import { ArrowRight, BadgeCheck, CalendarDays } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/animated/reveal';
import { VysMaskotImage } from '@/components/brand/vys-maskot';
import { heroBullets, stats } from '@shared/content';

export function Hero() {
  return (
    <section className="section-shell relative mt-6 overflow-hidden rounded-brand border border-brand-purple/12 bg-white text-brand-ink shadow-brand-float">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-brand" />
      <div aria-hidden className="absolute inset-0 diagonal-rails opacity-[0.04]" />
      <div className="relative grid gap-8 p-5 md:min-h-[calc(100vh-36px)] md:grid-cols-[1.02fr_0.98fr] md:items-center md:p-10">
        <div className="flex max-w-[740px] flex-col justify-center py-8 md:py-10">
          <Reveal>
            <span className="inline-flex w-max items-center gap-2 rounded-brand bg-brand-purple-light px-3 py-2 text-xs font-black uppercase text-brand-purple-deep">
              <BadgeCheck size={15} />
              Parkour pro děti 6-16 let
            </span>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-5 text-[40px] font-black leading-none text-brand-ink md:text-7xl">
              TeamVYS dává dětem odvahu v pohybu
            </h1>
          </Reveal>
          <Reveal delay={210}>
            <p className="mt-4 max-w-[630px] text-sm leading-6 text-brand-ink-soft md:mt-5 md:text-lg md:leading-7">
              Pravidelné kroužky, tábory a workshopy s trenéry, kteří drží bezpečný postup. Rodič má platby, docházku i progres dítěte v digitálním systému.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-5 flex flex-wrap items-center gap-3 md:mt-7">
              <Link href="/krouzky" className="inline-flex items-center gap-2 rounded-brand bg-gradient-brand px-5 py-4 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5">
                Vybrat kroužek
                <ArrowRight size={18} />
              </Link>
              <Link href="/tabory" className="inline-flex items-center gap-2 rounded-brand border border-brand-purple/15 bg-brand-paper px-5 py-4 text-sm font-black text-brand-ink transition-colors hover:bg-brand-purple-light">
                Tábory 2026
                <CalendarDays size={18} />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={390}>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 md:mt-8">
              {heroBullets.map((bullet) => (
                <div key={bullet} className="border-l-2 border-brand-pink/70 pl-3 text-sm font-bold leading-6 text-brand-ink-soft">
                  {bullet}
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="flex items-center justify-center pb-5 md:py-10">
          <div className="w-[min(68vw,310px)] drop-shadow-[0_34px_42px_rgba(83,36,140,0.20)] md:w-[min(38vw,430px)]">
            <VysMaskotImage priority sizes="(max-width: 768px) 68vw, 430px" />
          </div>
        </div>
      </div>

      <div className="relative grid border-t border-brand-purple/10 bg-brand-paper md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border-brand-purple/10 px-6 py-5 md:border-r">
            <p className="text-3xl font-black gradient-text">{stat.value}</p>
            <p className="mt-1 text-sm font-semibold text-brand-ink-soft">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
