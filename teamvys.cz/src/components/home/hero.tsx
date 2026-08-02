'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

import { displayFont } from '@/lib/home-font';

const ease = [0.22, 1, 0.36, 1] as const;

// Staggered (not synced) offsets so the two headline words' color drift reads as
// organic rather than perfectly synced, without risking a client/server mismatch.
const wordAnimation = {
  parkour: { duration: 14, delay: -3 },
  teamVys: { duration: 16.5, delay: -9 },
};

type Chapter = {
  key: string;
  label: string;
  copy: string;
  cta: { label: string; href: string };
  media?: { src: string; alt: string; frame: 'phone' | 'photo' };
};

const chapters: Chapter[] = [
  {
    key: 'aplikace',
    label: 'Aplikace',
    copy: 'Appka, ve které dítě sbírá XP, rodič vidí platby a docházku a trenér zapisuje body přes NFC nebo QR.',
    cta: { label: 'Zjistit víc o appce', href: '/aplikace' },
    media: {
      src: '/telefon-mockup.png',
      alt: 'Appka TeamVYS na telefonu se skill tree, XP a digitální permanentkou účastníka',
      frame: 'phone',
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
    media: {
      src: '/gallery/tabor-skupina.jpg',
      alt: 'Skupina dětí na příměstském táboře TeamVYS',
      frame: 'photo',
    },
  },
  {
    key: 'krouzky',
    label: 'Kroužky',
    copy: 'Pravidelný trénink v 6 městech. Permanentka s NFC docházkou.',
    cta: { label: 'Vybrat kroužek', href: '/krouzky' },
    media: {
      src: '/gallery/parkour-akce.jpg',
      alt: 'Dítě trénující parkour na kroužku TeamVYS',
      frame: 'photo',
    },
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
          className="section-shell relative flex w-full flex-col items-start gap-8 text-left"
        >
          <div>
            <h1
              className={`${displayFont.className} block max-w-[9ch] text-[clamp(2.8rem,10vw,8rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-white ${glowClass}`}
              style={
                prefersReducedMotion
                  ? undefined
                  : { animationDuration: `${wordAnimation.parkour.duration}s`, animationDelay: `${wordAnimation.parkour.delay}s` }
              }
            >
              parkour
            </h1>
            <motion.p
              style={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : {
                      opacity: teamVysOpacity,
                      y: teamVysY,
                      animationDuration: `${wordAnimation.teamVys.duration}s`,
                      animationDelay: `${wordAnimation.teamVys.delay}s`,
                    }
              }
              className={`${displayFont.className} block max-w-[9ch] text-[clamp(2.8rem,10vw,8rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-white ${glowClass}`}
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
                {chapter.media ? (
                  <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-14">
                    <div className="flex flex-col items-start gap-3">
                      <span
                        className={`${displayFont.className} gradient-text block text-[clamp(1.8rem,4vw,3rem)] font-extrabold uppercase tracking-[-0.01em]`}
                      >
                        {chapter.label}
                      </span>
                      <p className="max-w-[38ch] text-base leading-7 text-white/75 md:text-lg">{chapter.copy}</p>
                      <Link
                        href={chapter.cta.href}
                        className="group mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-purple px-7 text-base font-black text-white transition-transform hover:-translate-y-0.5"
                      >
                        {chapter.cta.label}
                        <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Link>
                    </div>

                    {chapter.media.frame === 'phone' ? (
                      <div className="relative w-full max-w-[200px] lg:max-w-[240px]">
                        <div
                          aria-hidden
                          className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(139,29,255,0.20),transparent_60%)] blur-2xl"
                        />
                        <Image
                          src={chapter.media.src}
                          alt={chapter.media.alt}
                          width={520}
                          height={720}
                          priority={index === 0}
                          className="relative w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
                        />
                      </div>
                    ) : (
                      <div className="relative aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-[24px] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.5)] lg:max-w-[300px]">
                        <Image
                          src={chapter.media.src}
                          alt={chapter.media.alt}
                          fill
                          sizes="(min-width: 1024px) 300px, 260px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex w-full max-w-[640px] flex-col items-start gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-[38ch]">
                      <span
                        className={`${displayFont.className} gradient-text block text-[clamp(1.8rem,4vw,3rem)] font-extrabold uppercase tracking-[-0.01em]`}
                      >
                        {chapter.label}
                      </span>
                      <p className="mt-2 text-base leading-7 text-white/75 md:text-lg">{chapter.copy}</p>
                    </div>
                    <Link
                      href={chapter.cta.href}
                      className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-brand-purple px-7 text-base font-black text-white transition-transform hover:-translate-y-0.5"
                    >
                      {chapter.cta.label}
                      <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
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
