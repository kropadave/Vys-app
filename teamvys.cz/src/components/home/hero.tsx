'use client';

import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

import { displayFont } from '@/lib/home-font';

const ease = [0.22, 1, 0.36, 1] as const;

// Staggered (not synced) offsets per word so the color drift reads as organic/decentralized
// rather than a single pulsing block, without risking a client/server render mismatch.
const wordAnimation = {
  vys: { duration: 13, delay: -2.5 },
  parkour: { duration: 15.5, delay: -8 },
  hrou: { duration: 17, delay: -12 },
};

type Chapter = {
  key: string;
  label: string;
  copy?: string;
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
    cta: { label: 'Vybrat workshop', href: '/workshopy' },
  },
  {
    key: 'tabory',
    label: 'Tábory',
    cta: { label: 'Vybrat tábor', href: '/tabory' },
  },
  {
    key: 'krouzky',
    label: 'Kroužky',
    cta: { label: 'Vybrat kroužek', href: '/krouzky' },
  },
];

export function HomeHero() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  const vysOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const vysY = useTransform(scrollYProgress, [0, 0.08], [0, -30]);
  const hrouOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const hrouY = useTransform(scrollYProgress, [0, 0.08], [0, 30]);

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
          className="section-shell relative flex w-full flex-col items-center gap-8 text-center"
        >
          <h1
            className={`${displayFont.className} max-w-[10ch] text-[clamp(2.6rem,10vw,8rem)] font-extrabold uppercase leading-[0.96] tracking-[-0.03em] text-white`}
          >
            <motion.span
              style={
                prefersReducedMotion
                  ? undefined
                  : {
                      opacity: vysOpacity,
                      y: vysY,
                      animationDuration: `${wordAnimation.vys.duration}s`,
                      animationDelay: `${wordAnimation.vys.delay}s`,
                    }
              }
              className={`block ${glowClass}`}
            >
              VYS
            </motion.span>
            <span
              style={
                prefersReducedMotion
                  ? undefined
                  : { animationDuration: `${wordAnimation.parkour.duration}s`, animationDelay: `${wordAnimation.parkour.delay}s` }
              }
              className={`block ${glowClass}`}
            >
              parkour
            </span>
            <motion.span
              style={
                prefersReducedMotion
                  ? undefined
                  : {
                      opacity: hrouOpacity,
                      y: hrouY,
                      animationDuration: `${wordAnimation.hrou.duration}s`,
                      animationDelay: `${wordAnimation.hrou.delay}s`,
                    }
              }
              className={`block ${glowClass}`}
            >
              hrou
            </motion.span>
          </h1>

          <div className="grid w-full place-items-center">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.key}
                style={prefersReducedMotion ? { opacity: index === 0 ? 1 : 0 } : chapterMotion[index]}
                className="col-start-1 row-start-1 flex flex-col items-center gap-5 lg:flex-row lg:gap-12"
              >
                <div className="flex flex-col items-center gap-3 lg:items-start lg:text-left">
                  <span
                    className={`${displayFont.className} gradient-text block text-[clamp(1.5rem,3.6vw,2.4rem)] font-extrabold uppercase tracking-[-0.01em]`}
                  >
                    {chapter.label}
                  </span>
                  {chapter.copy ? (
                    <p className="max-w-[36ch] text-sm leading-6 text-white/60 md:text-base">{chapter.copy}</p>
                  ) : null}
                  <Link
                    href={chapter.cta.href}
                    className="group mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-purple px-6 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
                  >
                    {chapter.cta.label}
                    <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>

                {chapter.image ? (
                  <div className="relative mx-auto w-full max-w-[220px] lg:max-w-[260px]">
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
                      className="relative mx-auto w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
                    />
                  </div>
                ) : null}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
