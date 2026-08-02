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

/** Minimal closing CTA — a single calm dark card on the light page. */
export function SubpageCta({ eyebrow, title, highlight, body, ctaHref, ctaLabel, secondaryHref, secondaryLabel }: Props) {
  return (
    <section className="section-shell py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease }}
        className="rounded-[28px] bg-brand-ink px-6 py-14 text-center md:px-12 md:py-20"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-purple-light">{eyebrow}</p>
        <h2 className="mx-auto mt-3 max-w-[20ch] text-3xl font-black leading-tight tracking-tight text-white md:text-5xl">
          {title}
          {highlight ? <span className="text-brand-purple-light"> {highlight}</span> : null}
        </h2>
        {body ? <p className="mx-auto mt-4 max-w-[52ch] text-sm leading-7 text-white/55 md:text-base">{body}</p> : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ctaHref}
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-brand-purple px-7 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            {ctaLabel}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex h-12 items-center rounded-full border border-white/15 px-7 text-sm font-bold text-white/85 transition-colors hover:bg-white/10"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
