import { ArrowRight, CalendarDays, MapPin, QrCode, ScanLine } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/animated/reveal';

const programs = [
  {
    href: '/krouzky' as const,
    eyebrow: 'Pravidelně',
    title: 'Kroužky',
    body: 'Permanentky 10 nebo 15 vstupů, NFC docházka a progres v rodičovském profilu.',
    image: '/courses/prostejov_Prostejov_parkour_main.webp',
    icon: ScanLine,
    detail: '6 měst · od 1790 Kč',
  },
  {
    href: '/tabory' as const,
    eyebrow: 'Léto',
    title: 'Tábory',
    body: 'Týden pohybu, her, tréninku a digitálních dokumentů pro rodiče.',
    image: '/courses/nadrazka_ZS-Nadrazka-Foto2.webp',
    icon: CalendarDays,
    detail: 'Vyškov & Veliny',
  },
  {
    href: '/workshopy' as const,
    eyebrow: 'Jednorázově',
    title: 'Workshopy',
    body: 'Konkrétní triky, QR ticket po platbě a rychlý posun ve skill tree.',
    image: '/courses/brandys_BR3.webp',
    icon: QrCode,
    detail: 'Praha · QR ticket',
  },
];

export function ProgramsSection() {
  return (
    <section className="section-shell py-16">
      <Reveal>
        <div className="max-w-[780px]">
          <p className="text-xs font-black uppercase text-brand-pink">Nabídka</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-brand-ink md:text-5xl">
            Vyber cestu, která sedí tempu dítěte.
          </h2>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {programs.map((program, index) => (
          <Reveal key={program.href} delay={index * 90}>
            <Link href={program.href} className="group block h-full">
              <article className="relative flex min-h-[430px] overflow-hidden rounded-brand border border-brand-purple/12 bg-white text-brand-ink shadow-brand-soft transition-transform duration-300 group-hover:-translate-y-1.5">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-brand" />
                <div className="relative flex w-full flex-col justify-between p-6">
                  <div className="flex items-center justify-between">
                    <span className="rounded-brand bg-brand-purple-light px-3 py-2 text-xs font-black uppercase text-brand-purple-deep">{program.eyebrow}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-brand bg-gradient-brand text-white">
                      <program.icon size={20} />
                    </span>
                  </div>
                  <div>
                    <p className="mb-3 inline-flex items-center gap-2 text-sm font-black text-brand-ink-soft">
                      <MapPin size={16} />
                      {program.detail}
                    </p>
                    <h3 className="text-3xl font-black leading-tight text-brand-ink md:text-4xl">
                    {program.title}
                  </h3>
                    <p className="mt-3 max-w-[320px] text-sm font-semibold leading-6 text-brand-ink-soft">{program.body}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand-purple-deep">
                      Zobrazit nabídku
                      <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
