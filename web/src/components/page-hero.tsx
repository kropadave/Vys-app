'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Props = {
  eyebrow: string;
  title: string;
  body?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

const ease = [0.22, 1, 0.36, 1] as const;

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: d, ease } }),
};

export function PageHero({ eyebrow, title, body, ctaHref, ctaLabel }: Props) {
  return (
    <section className="relative overflow-hidden" style={{ background: '#080412' }}>
      <div aria-hidden className="absolute inset-x-0 bottom-0 z-20 h-[2px] bg-white" />

      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[15%] top-[-20%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(139,29,255,0.24)_0%,transparent_70%)]" />
        <div className="absolute right-[-5%] top-[10%] h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,rgba(241,43,179,0.15)_0%,transparent_70%)]" />
      </div>

      {/* Subtle grid */}
      <div
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(rgba(139,29,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(139,29,255,0.07)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:radial-gradient(ellipse_80%_60%_at_30%_50%,black,transparent)]"
      />

      <div className="section-shell relative py-16 md:py-24 lg:py-28">
        <motion.span
          initial="hidden"
          animate="visible"
          variants={item}
          custom={0}
          className="inline-flex w-max items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white/70"
        >
          {eyebrow}
        </motion.span>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={item}
          custom={0.1}
          className="mt-4 max-w-[18ch] text-[clamp(2.4rem,6vw,5.5rem)] font-black leading-[1.05] tracking-[-0.035em] text-white"
        >
          {title}
        </motion.h1>

        {body && (
          <motion.p
            initial="hidden"
            animate="visible"
            variants={item}
            custom={0.2}
            className="mt-4 max-w-[600px] text-sm leading-6 text-white/60 md:text-lg md:leading-7"
          >
            {body}
          </motion.p>
        )}

        {ctaHref && ctaLabel && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={item}
            custom={0.3}
            className="mt-8"
          >
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(139,29,255,0.34)] transition-all hover:-translate-y-0.5"
            >
              {ctaLabel}
              <ArrowRight size={15} />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
