'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, MapPin, QrCode, ScanLine } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

import { Reveal } from '@/components/animated/reveal';

const programs = [
  {
    href: '/krouzky' as const,
    eyebrow: 'Pravidelně',
    title: 'Kroužky',
    body: 'Permanentky 10 nebo 15 vstupů, NFC docházka a progres v rodičovském profilu.',
    icon: ScanLine,
    detail: '6 měst · od 1790 Kč',
  },
  {
    href: '/tabory' as const,
    eyebrow: 'Léto',
    title: 'Tábory',
    body: 'Týden pohybu, her, tréninku a digitálních dokumentů pro rodiče.',
    icon: CalendarDays,
    detail: 'Vyškov & Veliny',
  },
  {
    href: '/workshopy' as const,
    eyebrow: 'Jednorázově',
    title: 'Workshopy',
    body: 'Konkrétní triky, QR ticket po platbě a rychlý posun ve skill tree.',
    icon: QrCode,
    detail: 'Praha · QR ticket',
  },
];

const cardEase = [0.22, 1, 0.36, 1] as const;

const cardListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.58, ease: cardEase } },
};

export function ProgramsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="section-shell py-14 md:py-16">
      <Reveal>
        <div className="max-w-[780px]">
          <p className="text-xs font-black uppercase text-brand-pink">Nabídka</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-brand-ink md:text-5xl">
            Vyber cestu, která sedí tempu dítěte.
          </h2>
        </div>
      </Reveal>

      {/* Mobile: horizontal scroll with snap. Desktop: 3-col grid */}
      <motion.div
        ref={scrollRef}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-90px' }}
        variants={cardListVariants}
        className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 scrollbar-none sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3"
      >
        {programs.map((program, index) => (
          <motion.div key={program.href} variants={cardVariants} className="shrink-0 w-[82vw] snap-center sm:w-auto">
            <Link href={program.href} className="group block h-full">
              <article className="relative flex h-full min-h-[350px] flex-col overflow-hidden rounded-[24px] border border-brand-purple/12 bg-white text-brand-ink shadow-brand-soft transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-brand sm:min-h-[370px]">
                <div className="relative h-36 shrink-0 overflow-hidden bg-[linear-gradient(135deg,rgba(139,29,255,0.10),rgba(241,43,179,0.06)_56%,rgba(255,178,26,0.08))] p-5">
                  <div aria-hidden className="absolute inset-0 diagonal-rails opacity-[0.04]" />
                  <span className="relative inline-flex rounded-[14px] bg-white/80 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-brand-purple shadow-sm backdrop-blur-sm">
                    {program.eyebrow}
                  </span>
                  <span className="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-[18px] bg-brand-purple text-white shadow-brand-soft transition-transform duration-300 group-hover:scale-105">
                    <program.icon size={20} />
                  </span>
                  <p className="absolute bottom-5 left-5 inline-flex items-center gap-1.5 text-[11px] font-black text-brand-ink-soft">
                    <MapPin size={12} className="text-brand-purple" />
                    {program.detail}
                  </p>
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="text-2xl font-black leading-tight text-brand-ink">{program.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-brand-ink-soft">{program.body}</p>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand-purple transition-gap duration-300 group-hover:gap-3">
                    Zobrazit nabídku
                    <ArrowRight size={16} />
                  </span>
                </div>
                <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-brand opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </article>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Mobile scroll hint dots */}
      <div className="mt-3 flex justify-center gap-2 sm:hidden">
        {programs.map((p, i) => (
          <span key={p.href} className={`h-1.5 rounded-full bg-brand-purple/30 transition-all ${i === 0 ? 'w-5 bg-brand-purple' : 'w-1.5'}`} />
        ))}
      </div>
    </section>
  );
}
