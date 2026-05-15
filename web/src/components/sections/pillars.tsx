'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Smartphone, Trophy, Users } from 'lucide-react';

import { Reveal } from '@/components/animated/reveal';
import { aboutPillars } from '@shared/content';

const icons = [ShieldCheck, Trophy, Users, Smartphone];
const pillarEase = [0.22, 1, 0.36, 1] as const;

const pillarListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const pillarVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.56, ease: pillarEase } },
};

export function PillarsSection() {
  return (
    <section className="section-shell py-16">
      <Reveal>
        <div className="max-w-[760px]">
          <p className="text-xs font-black uppercase text-brand-cyan">Proč TeamVYS</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-brand-ink md:text-5xl">
            Bezpečný sport, který má energii hry i jasný systém.
          </h2>
        </div>
      </Reveal>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-90px' }}
        variants={pillarListVariants}
        className="mt-8 grid gap-4 md:grid-cols-2"
      >
        {aboutPillars.map((pillar, index) => {
          const Icon = icons[index % icons.length];
          return (
            <motion.article key={pillar.title} variants={pillarVariants} className="h-full rounded-brand border border-brand-purple/12 bg-white p-6 shadow-brand-soft">
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-brand bg-gradient-brand text-white">
                  <Icon size={22} />
                </span>
                <span className="text-sm font-black text-brand-pink">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-8 text-2xl font-black leading-tight text-brand-ink">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">{pillar.body}</p>
              <div className="mt-6 h-1 w-16 bg-gradient-brand" />
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
