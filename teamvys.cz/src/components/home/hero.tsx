'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { displayFont } from '@/lib/home-font';

const ease = [0.22, 1, 0.36, 1] as const;

const words = ['VYS', 'parkour', 'hrou'];

// Staggered (not synced) offsets per word so the color drift reads as organic/decentralized
// rather than a single pulsing block, without risking a client/server render mismatch.
const wordAnimation = [
  { duration: 13, delay: -2.5 },
  { duration: 15.5, delay: -8 },
  { duration: 17, delay: -12 },
];

export function HomeHero() {
  const prefersReducedMotion = useReducedMotion();

  const item = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 22 },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay, ease } }),
  };

  return (
    <section className="relative flex min-h-dvh flex-col overflow-hidden bg-[#0B0B10]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_18%_22%,rgba(139,29,255,0.14),transparent_42%),radial-gradient(circle_at_82%_78%,rgba(178,59,255,0.10),transparent_46%)]"
      />

      <div className="section-shell relative flex flex-1 items-center py-14 md:py-20 lg:py-24">
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={item}
          custom={0}
          className={`${displayFont.className} max-w-[10ch] text-[clamp(3.2rem,14vw,13rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.04em] text-white`}
        >
          {words.map((word, index) => (
            <span
              key={word}
              className={prefersReducedMotion ? undefined : 'hero-word-glow'}
              style={
                prefersReducedMotion
                  ? undefined
                  : {
                      animationDuration: `${wordAnimation[index].duration}s`,
                      animationDelay: `${wordAnimation[index].delay}s`,
                    }
              }
            >
              {word}
              {index < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </motion.h1>
      </div>
    </section>
  );
}
