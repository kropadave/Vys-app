'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

import { displayFont } from '@/lib/home-font';

const ease = [0.22, 1, 0.36, 1] as const;

// Staggered (not synced) offsets so each headline word's color drift reads as
// organic rather than perfectly synced, without risking a client/server mismatch.
const wordTimings = [
  { duration: 13, delay: -2 },
  { duration: 15, delay: -6 },
  { duration: 17, delay: -10 },
  { duration: 14, delay: -4 },
  { duration: 16, delay: -8 },
];

type Chapter = {
  key: string;
  label: string;
  copy: string;
  cta: { label: string; href: string };
};

const chapters: Chapter[] = [
  {
    key: 'aplikace',
    label: 'Aplikace',
    copy: 'Appka, ve které trénink pokračuje i doma. Dítě v ní sbírá XP a odemyká nové triky na skill tree, rodič má na jednom místě docházku, platby i permanentku, trenér zapisuje body přes NFC čip nebo QR kód místo papírového archu.',
    cta: { label: 'Zjistit víc o appce', href: '/aplikace' },
  },
  {
    key: 'workshopy',
    label: 'Workshopy',
    copy: 'Jednorázové parkour akce s jasným tématem — každý workshop má konkrétní triky, které se učíte krok za krokem. Po zaplacení dostaneš digitální QR ticket ke kontrole na místě a trenér ví přesně, které prvky může dítěti zapsat do profilu.',
    cta: { label: 'Vybrat workshop', href: '/workshopy' },
  },
  {
    key: 'tabory',
    label: 'Tábory',
    copy: 'Týden pohybu, her a parkour výzev s jasným režimem dne. Jídlo, pitný režim i táborové tričko jsou v ceně, dohled mají certifikovaní trenéři a animátoři. Dokumenty a přihlášku vyřešíš online předem, první den stačí jen nahlásit jméno.',
    cta: { label: 'Vybrat tábor', href: '/tabory' },
  },
  {
    key: 'krouzky',
    label: 'Kroužky',
    copy: 'Pravidelný trénink každý týden v šesti městech s certifikovanými trenéry. Permanentka na 10 nebo 15 vstupů se odečítá postupně přes NFC čip, takže žádný závazek na celý rok. Dítě sbírá XP, odemyká triky a vidí svůj postup rovnou v appce.',
    cta: { label: 'Vybrat kroužek', href: '/krouzky' },
  },
];

export function HomeHero() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  // Slide 0 is the plain "Team VYS" brand word; slides 1-4 are the chapters.
  // Each fades in, holds, then fades out — except the last, which stays once revealed.
  const s0Opacity = useTransform(scrollYProgress, [0, 0.05, 0.09], [1, 1, 0]);
  const s0Y = useTransform(scrollYProgress, [0, 0.09], [0, -16]);
  const s1Opacity = useTransform(scrollYProgress, [0.05, 0.11, 0.24, 0.3], [0, 1, 1, 0]);
  const s1Y = useTransform(scrollYProgress, [0.05, 0.11], [20, 0]);
  const s2Opacity = useTransform(scrollYProgress, [0.3, 0.36, 0.49, 0.55], [0, 1, 1, 0]);
  const s2Y = useTransform(scrollYProgress, [0.3, 0.36], [20, 0]);
  const s3Opacity = useTransform(scrollYProgress, [0.55, 0.61, 0.74, 0.8], [0, 1, 1, 0]);
  const s3Y = useTransform(scrollYProgress, [0.55, 0.61], [20, 0]);
  const s4Opacity = useTransform(scrollYProgress, [0.8, 0.86], [0, 1]);
  const s4Y = useTransform(scrollYProgress, [0.8, 0.86], [20, 0]);

  const slideMotion = [
    { opacity: s0Opacity, y: s0Y },
    { opacity: s1Opacity, y: s1Y },
    { opacity: s2Opacity, y: s2Y },
    { opacity: s3Opacity, y: s3Y },
    { opacity: s4Opacity, y: s4Y },
  ];

  const glowClass = prefersReducedMotion ? '' : 'hero-word-glow';
  const words = ['Team VYS', ...chapters.map((c) => c.label)];

  return (
    <section ref={containerRef} className="relative bg-[#0B0B10] lg:h-[360vh]">
      <div className="relative flex flex-col items-center justify-center overflow-hidden py-20 lg:sticky lg:top-0 lg:h-dvh lg:py-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_18%_22%,rgba(139,29,255,0.14),transparent_42%),radial-gradient(circle_at_82%_78%,rgba(178,59,255,0.10),transparent_46%)]"
        />

        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="section-shell relative flex w-full flex-col items-start gap-3 text-left"
        >
          <h1
            className={`${displayFont.className} block max-w-[9ch] text-[clamp(3.2rem,12vw,9.5rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-white ${glowClass}`}
            style={
              prefersReducedMotion
                ? undefined
                : { animationDuration: `${wordTimings[1].duration}s`, animationDelay: `${wordTimings[1].delay}s` }
            }
          >
            parkour
          </h1>

          {/* Swappable headline word: "Team VYS" crossfades into each chapter's name, in place */}
          <div className="relative grid w-full place-items-start">
            {words.map((word, index) => (
              <motion.span
                key={word}
                style={
                  prefersReducedMotion
                    ? { opacity: index === 1 ? 1 : 0 }
                    : {
                        ...slideMotion[index],
                        animationDuration: `${wordTimings[index].duration}s`,
                        animationDelay: `${wordTimings[index].delay}s`,
                      }
                }
                className={`${displayFont.className} col-start-1 row-start-1 block max-w-[9ch] text-[clamp(3.2rem,12vw,9.5rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-white ${glowClass}`}
              >
                {word}
              </motion.span>
            ))}
          </div>

          {/* Supporting copy + CTA per chapter, synced with the headline word above */}
          <div className="relative mt-6 grid w-full place-items-start">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.key}
                style={prefersReducedMotion ? { opacity: index === 0 ? 1 : 0 } : slideMotion[index + 1]}
                className="col-start-1 row-start-1 flex w-full flex-col items-start gap-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <p className="max-w-[54ch] text-base leading-7 text-white md:text-lg md:leading-8">{chapter.copy}</p>
                <Link
                  href={chapter.cta.href}
                  className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-purple px-7 text-base font-black text-white transition-transform hover:-translate-y-0.5"
                >
                  {chapter.cta.label}
                  <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
