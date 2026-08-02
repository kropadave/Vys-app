'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

import { displayFont } from '@/lib/home-font';

const ease = [0.22, 1, 0.36, 1] as const;

type Chapter = {
  key: string;
  label: string;
  copy: string;
  cta: { label: string; href: string };
  image?: { src: string; alt: string };
};

const chapters: Chapter[] = [
  {
    key: 'aplikace',
    label: 'Aplikace',
    copy: 'Appka, ve které dítě sbírá XP, rodič vidí platby a docházku a trenér zapisuje body přes NFC nebo QR.',
    cta: { label: 'Zjistit víc o appce', href: '/aplikace' },
    image: {
      src: '/telefon-mockup.png',
      alt: 'Appka TeamVYS na telefonu se skill tree, XP a digitální permanentkou účastníka',
    },
  },
  {
    key: 'workshopy',
    label: 'Workshopy',
    copy: 'Jednorázové akce pro rychlý progres — kratší, intenzivní, s jasným výsledkem.',
    cta: { label: 'Vybrat workshop', href: '/workshopy' },
  },
  {
    key: 'tabory',
    label: 'Tábory',
    copy: 'Týden pohybu, her a parkour výzev. Bezpečný trénink a jasný režim dne.',
    cta: { label: 'Vybrat tábor', href: '/tabory' },
  },
  {
    key: 'krouzky',
    label: 'Kroužky',
    copy: 'Pravidelný trénink v 6 městech. Permanentka s NFC docházkou.',
    cta: { label: 'Vybrat kroužek', href: '/krouzky' },
  },
];

export function HomeHero() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  const teamVysOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const teamVysY = useTransform(scrollYProgress, [0, 0.08], [0, -16]);

  // Each chapter fades in, holds, then fades out — except the last one, which
  // simply stays visible once revealed so the sequence ends on a settled frame.
  const ch0Opacity = useTransform(scrollYProgress, [0.08, 0.14, 0.26, 0.32], [0, 1, 1, 0]);
  const ch0Y = useTransform(scrollYProgress, [0.08, 0.14], [24, 0]);
  const ch1Opacity = useTransform(scrollYProgress, [0.32, 0.38, 0.5, 0.56], [0, 1, 1, 0]);
  const ch1Y = useTransform(scrollYProgress, [0.32, 0.38], [24, 0]);
  const ch2Opacity = useTransform(scrollYProgress, [0.56, 0.62, 0.74, 0.8], [0, 1, 1, 0]);
  const ch2Y = useTransform(scrollYProgress, [0.56, 0.62], [24, 0]);
  const ch3Opacity = useTransform(scrollYProgress, [0.8, 0.86], [0, 1]);
  const ch3Y = useTransform(scrollYProgress, [0.8, 0.86], [24, 0]);

  const chapterMotion = [
    { opacity: ch0Opacity, y: ch0Y },
    { opacity: ch1Opacity, y: ch1Y },
    { opacity: ch2Opacity, y: ch2Y },
    { opacity: ch3Opacity, y: ch3Y },
  ];

  const glowClass = prefersReducedMotion ? '' : 'hero-word-glow';

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
          className="section-shell relative flex w-full flex-col items-start gap-10 text-left"
        >
          <div>
            <h1
              className={`${displayFont.className} block max-w-[9ch] text-[clamp(3.2rem,12vw,10rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-white ${glowClass}`}
            >
              parkour
            </h1>
            <motion.p
              style={prefersReducedMotion ? { opacity: 1 } : { opacity: teamVysOpacity, y: teamVysY }}
              className="mt-2 text-[clamp(1rem,2.4vw,1.5rem)] font-bold uppercase tracking-[0.2em] text-white/60"
            >
              Team VYS
            </motion.p>
          </div>

          <div className="grid w-full place-items-start">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.key}
                style={prefersReducedMotion ? { opacity: index === 0 ? 1 : 0 } : chapterMotion[index]}
                className="col-start-1 row-start-1 w-full"
              >
                {chapter.image ? (
                  <div className="flex flex-col items-start gap-5 lg:flex-row lg:items-center lg:gap-12">
                    <div className="flex flex-col items-start gap-3">
                      <span
                        className={`${displayFont.className} gradient-text block text-[clamp(1.4rem,3.2vw,2.2rem)] font-extrabold uppercase tracking-[-0.01em]`}
                      >
                        {chapter.label}
                      </span>
                      <p className="max-w-[36ch] text-sm leading-6 text-white/60 md:text-base">{chapter.copy}</p>
                      <Link
                        href={chapter.cta.href}
                        className="group mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-purple px-6 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
                      >
                        {chapter.cta.label}
                        <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
                    </div>

                    <div className="relative w-full max-w-[200px] lg:max-w-[240px]">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(139,29,255,0.20),transparent_60%)] blur-2xl"
                      />
                      <Image
                        src={chapter.image.src}
                        alt={chapter.image.alt}
                        width={520}
                        height={720}
                        priority={index === 0}
                        className="relative w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full max-w-[640px] flex-col items-start gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-[36ch]">
                      <span
                        className={`${displayFont.className} gradient-text block text-[clamp(1.4rem,3.2vw,2.2rem)] font-extrabold uppercase tracking-[-0.01em]`}
                      >
                        {chapter.label}
                      </span>
                      <p className="mt-2 text-sm leading-6 text-white/60 md:text-base">{chapter.copy}</p>
                    </div>
                    <Link
                      href={chapter.cta.href}
                      className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-purple px-6 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
                    >
                      {chapter.cta.label}
                      <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
