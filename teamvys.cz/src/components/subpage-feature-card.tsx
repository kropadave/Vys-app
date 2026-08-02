'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;

type Accent = 'purple' | 'pink' | 'cyan';

/**
 * Premium dark feature card — glassy surface, hairline border, single accent.
 * The `accent` prop is kept for API compatibility but unified to one calm accent.
 */
export function FeatureCard({
  icon,
  eyebrow,
  title,
  body,
  index = 0,
}: {
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  body: string;
  accent?: Accent;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease }}
      className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors duration-300 hover:border-brand-purple/50 md:p-7"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-purple/15 text-brand-purple-light ring-1 ring-inset ring-white/10">
        {icon}
      </span>
      {eyebrow ? <p className="mt-6 text-xs font-bold uppercase tracking-wider text-brand-purple-light">{eyebrow}</p> : null}
      <h3 className="mt-2 text-lg font-black leading-tight text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">{body}</p>
    </motion.div>
  );
}

/** Compact left-aligned section intro used above subpage content (dark). */
export function SectionIntro({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
  accent?: Accent;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.5, ease }}
      className="max-w-[680px]"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-brand-purple-light">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-white md:text-4xl">{title}</h2>
    </motion.div>
  );
}
