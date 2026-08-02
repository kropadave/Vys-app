'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const ease = [0.22, 1, 0.36, 1] as const;

type Props = {
  eyebrow: string;
  title: string;
  body?: string;
  ctaHref?: string;
  ctaLabel?: string;
  /** Kept for backwards compatibility with existing callers; no longer rendered. */
  word?: string;
};

/** Clean, minimal page header shared across all public subpages. */
export function PageHero({ eyebrow, title, body, ctaHref, ctaLabel }: Props) {
  return (
    <section className="border-b border-black/[0.06] bg-white pt-28 md:pt-32">
      <div className="section-shell pb-14 md:pb-20">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-brand-purple"
        >
          {eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.06, ease }}
          className="mt-4 max-w-[16ch] text-4xl font-black leading-[1.05] tracking-tight text-brand-ink md:text-6xl"
        >
          {title}
        </motion.h1>

        {body ? (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease }}
            className="mt-5 max-w-[560px] text-base leading-7 text-neutral-500 md:text-lg"
          >
            {body}
          </motion.p>
        ) : null}

        {ctaHref && ctaLabel ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease }}
            className="mt-8"
          >
            <Link
              href={ctaHref}
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-brand-purple px-6 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              {ctaLabel}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}
