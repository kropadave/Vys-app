'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
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

export function HomeHero() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });

  const vysOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);
  const vysY = useTransform(scrollYProgress, [0, 0.22], [0, -70]);
  const hrouOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0]);
  const hrouY = useTransform(scrollYProgress, [0, 0.22], [0, 70]);

  const appWordOpacity = useTransform(scrollYProgress, [0.24, 0.4], [0, 1]);
  const appWordY = useTransform(scrollYProgress, [0.24, 0.4], [30, 0]);

  const introOpacity = useTransform(scrollYProgress, [0.38, 0.56], [0, 1]);
  const introY = useTransform(scrollYProgress, [0.38, 0.56], [26, 0]);

  const imageOpacity = useTransform(scrollYProgress, [0.54, 0.78], [0, 1]);
  const imageY = useTransform(scrollYProgress, [0.54, 0.78], [36, 0]);
  const imageScale = useTransform(scrollYProgress, [0.54, 0.78], [0.94, 1]);

  const glowClass = prefersReducedMotion ? '' : 'hero-word-glow';

  return (
    <section ref={containerRef} className="relative bg-[#0B0B10] lg:h-[240vh]">
      <div className="relative flex flex-col items-center justify-center overflow-hidden py-20 lg:sticky lg:top-0 lg:h-dvh lg:py-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_18%_22%,rgba(139,29,255,0.14),transparent_42%),radial-gradient(circle_at_82%_78%,rgba(178,59,255,0.10),transparent_46%)]"
        />

        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="section-shell relative flex w-full flex-col items-center gap-10 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:text-left"
        >
          <div className="flex flex-col items-center lg:items-start">
            <div
              className={`${displayFont.className} relative max-w-[10ch] text-[clamp(3.2rem,14vw,13rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.04em] text-white`}
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
                className={`absolute inset-x-0 bottom-full block ${glowClass}`}
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
                className={`absolute inset-x-0 top-full block ${glowClass}`}
              >
                hrou
              </motion.span>
            </div>

            <motion.span
              style={prefersReducedMotion ? { opacity: 1 } : { opacity: appWordOpacity, y: appWordY }}
              className={`${displayFont.className} gradient-text mt-5 block text-[clamp(1.6rem,4vw,2.6rem)] font-extrabold uppercase tracking-[-0.02em] lg:mt-8`}
            >
              Aplikace
            </motion.span>

            <motion.div
              style={prefersReducedMotion ? { opacity: 1 } : { opacity: introOpacity, y: introY }}
              className="mt-5 max-w-[46ch]"
            >
              <h2 className={`${displayFont.className} text-[clamp(1.5rem,3vw,2rem)] font-extrabold leading-[1.14] text-white`}>
                Appka, díky které trénink nekončí na rohožce.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/65 md:text-base md:leading-7">
                Kroužek, tábor i workshop mají svou appku. Dítě v ní sbírá XP, rodič vidí platby a docházku,
                trenér zapisuje body přes NFC nebo QR. Bez appky by to bylo jen razítko v sešitě.
              </p>
            </motion.div>
          </div>

          <motion.div
            style={prefersReducedMotion ? { opacity: 1 } : { opacity: imageOpacity, y: imageY, scale: imageScale }}
            className="relative mx-auto w-full max-w-[260px] lg:max-w-[320px]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(139,29,255,0.22),transparent_60%)] blur-2xl"
            />
            <Image
              src="/telefon-mockup.png"
              alt="Appka TeamVYS na telefonu se skill tree, XP a digitální permanentkou účastníka"
              width={520}
              height={720}
              priority
              className="relative mx-auto w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
