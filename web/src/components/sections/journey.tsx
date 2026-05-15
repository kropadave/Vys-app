'use client';

import { motion } from 'framer-motion';
import { CreditCard, ScanLine, Search, Trophy } from 'lucide-react';

import { Reveal } from '@/components/animated/reveal';

const journey = [
  { step: '01', title: 'Najdi město', body: 'Vyber lokalitu, den a čas podle rozvrhu rodiny.', icon: Search },
  { step: '02', title: 'Zaplať online', body: 'Stripe Checkout vytvoří objednávku pro konkrétní dítě.', icon: CreditCard },
  { step: '03', title: 'Přijď na trénink', body: 'NFC čip zrychlí docházku a rodič vidí účast.', icon: ScanLine },
  { step: '04', title: 'Odemkni progres', body: 'Triky, XP a náramky drží motivaci i bezpečný postup.', icon: Trophy },
];

const stepEase = [0.22, 1, 0.36, 1] as const;

const stepsListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const stepVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.56, ease: stepEase } },
};

export function JourneySection() {
  return (
    <section className="section-shell py-14 md:py-16">
      <div className="overflow-hidden rounded-[32px] border border-brand-purple/12 bg-white text-brand-ink shadow-brand-float">
        {/* Heading */}
        <div className="p-6 pb-0 sm:p-8 sm:pb-0 md:p-10 md:pb-0">
          <Reveal>
            <p className="text-xs font-black uppercase text-brand-pink">Jak to běží</p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              Od výběru k prvnímu odemčenému triku.
            </h2>
          </Reveal>
        </div>

        {/* Mobile: numbered timeline list */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-90px' }}
          variants={stepsListVariants}
          className="flex flex-col gap-0 p-5 pt-7 sm:hidden"
        >
          {journey.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div key={step.step} variants={stepVariants} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Vertical connector */}
                {index < journey.length - 1 && (
                  <div aria-hidden className="absolute left-[19px] top-12 h-[calc(100%-36px)] w-[2px] bg-gradient-to-b from-brand-purple/20 to-transparent" />
                )}
                {/* Icon circle */}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-purple text-white shadow-lg">
                  <Icon size={17} />
                </div>
                <div className="min-w-0 pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-black text-brand-pink">{step.step}</span>
                    <h3 className="text-base font-black text-brand-ink">{step.title}</h3>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-brand-ink-soft">{step.body}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Desktop (sm+): 2×2 grid on sm, 4-col on md */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-90px' }}
          variants={stepsListVariants}
          className="hidden gap-px bg-brand-purple/8 sm:grid sm:grid-cols-2 md:grid-cols-4"
        >
          {journey.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.step}
                variants={stepVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="flex h-full flex-col bg-white p-6 transition-colors hover:bg-brand-paper md:p-7"
              >
                <span className="text-[11px] font-black tracking-wide text-brand-pink">{step.step}</span>
                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-[18px] bg-brand-purple text-white shadow-md">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-xl font-black text-brand-ink">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-brand-ink-soft">{step.body}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
