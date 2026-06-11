'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  eyebrow: string;
  title: string;
  highlight?: string;
  body?: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

/** Dark closing CTA shared by all public subpages — mirrors the homepage design language. */
export function SubpageCta({ eyebrow, title, highlight, body, ctaHref, ctaLabel, secondaryHref, secondaryLabel }: Props) {
  return (
    <section className="relative overflow-hidden bg-gradient-night py-20 md:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,29,255,0.22)_0%,transparent_65%)]" />
        <div className="absolute right-[-10%] bottom-[-30%] h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,rgba(241,43,179,0.14)_0%,transparent_70%)]" />
      </div>

      <div className="section-shell relative text-center">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease }}
          className="text-xs font-black uppercase tracking-[0.22em] text-white/50"
        >
          {eyebrow}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.08, ease }}
          className="mx-auto mt-3 max-w-[22ch] text-3xl font-black leading-[1.06] tracking-tight text-white md:text-5xl"
        >
          {title}
          {highlight ? <span className="bg-gradient-ember bg-clip-text text-transparent"> {highlight}</span> : null}
        </motion.h2>
        {body ? (
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.16, ease }}
            className="mx-auto mt-4 max-w-[54ch] text-sm font-bold leading-7 text-white/60 md:text-base"
          >
            {body}
          </motion.p>
        ) : null}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.22, ease }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href={ctaHref}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-ember px-7 text-sm font-black text-white shadow-[0_14px_36px_rgba(139,29,255,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(139,29,255,0.55)]"
          >
            {ctaLabel}
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-7 text-sm font-black text-white/85 backdrop-blur-sm transition-colors duration-200 hover:bg-white/[0.12]"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
