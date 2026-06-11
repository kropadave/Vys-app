'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;

type Accent = 'purple' | 'pink' | 'cyan';

const ACCENT: Record<Accent, { border: string; tile: string; icon: string; eyebrow: string; glow: string }> = {
  purple: {
    border: 'linear-gradient(135deg,rgba(139,29,255,0.32),rgba(241,43,179,0.16))',
    tile: 'from-brand-purple/18 to-brand-pink/8 border-brand-purple/25',
    icon: 'text-brand-purple',
    eyebrow: 'text-brand-purple',
    glow: 'rgba(139,29,255,0.14)',
  },
  pink: {
    border: 'linear-gradient(135deg,rgba(241,43,179,0.32),rgba(139,29,255,0.16))',
    tile: 'from-brand-pink/18 to-brand-purple/8 border-brand-pink/25',
    icon: 'text-brand-pink',
    eyebrow: 'text-brand-pink',
    glow: 'rgba(241,43,179,0.14)',
  },
  cyan: {
    border: 'linear-gradient(135deg,rgba(124,45,219,0.32),rgba(241,43,179,0.16))',
    tile: 'from-brand-cyan/18 to-brand-pink/8 border-brand-cyan/25',
    icon: 'text-brand-cyan',
    eyebrow: 'text-brand-cyan',
    glow: 'rgba(124,45,219,0.14)',
  },
};

/**
 * Premium subpage card — gradient border, glass icon tile and hover lift.
 * Replaces the old flat `rounded-brand` white blocks across all public subpages.
 */
export function FeatureCard({
  icon,
  eyebrow,
  title,
  body,
  accent = 'purple',
  index = 0,
}: {
  icon: ReactNode;
  eyebrow?: string;
  title: string;
  body: string;
  accent?: Accent;
  index?: number;
}) {
  const a = ACCENT[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease }}
      className="group relative h-full overflow-hidden rounded-[28px] bg-white shadow-brand-soft transition-all duration-500 hover:-translate-y-1.5 hover:shadow-brand-float"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[28px] border border-transparent"
        style={{ background: `linear-gradient(white,white) padding-box, ${a.border} border-box` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${a.glow} 0%, transparent 70%)` }}
      />
      <div className="relative p-6 md:p-7">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${a.tile} ${a.icon} shadow-[0_10px_24px_rgba(83,36,140,0.10)]`}
        >
          {icon}
        </span>
        {eyebrow ? <p className={`mt-5 text-xs font-black uppercase tracking-wider ${a.eyebrow}`}>{eyebrow}</p> : null}
        <h3 className="mt-2 text-lg font-black leading-tight text-brand-ink">{title}</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-brand-ink-soft">{body}</p>
      </div>
    </motion.div>
  );
}

/** Compact left-aligned section intro used above subpage card grids. */
export function SectionIntro({
  eyebrow,
  title,
  accent = 'purple',
}: {
  eyebrow: string;
  title: string;
  accent?: Accent;
}) {
  const a = ACCENT[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.6, ease }}
      className="max-w-[640px]"
    >
      <p className={`text-xs font-black uppercase tracking-widest ${a.eyebrow}`}>{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight text-brand-ink md:text-4xl">{title}</h2>
    </motion.div>
  );
}
