'use client';

import { motion } from 'framer-motion';
import { CalendarCheck, Map, Smartphone, Trophy } from 'lucide-react';
import Image from 'next/image';

const ease = [0.22, 1, 0.36, 1] as const;

const features = [
  {
    id: 'dochazka',
    icon: CalendarCheck,
    label: 'Docházka',
    description: 'Trenér přiloží NFC náramek nebo odklikne docházku ručně — rodič dostane notifikaci.',
  },
  {
    id: 'xp',
    icon: Trophy,
    label: 'XP a náramky',
    description: 'Děti sbírají XP za tréninky, postupují přes barevné náramky a otevírají bedny s odměnami.',
  },
  {
    id: 'permanentka',
    icon: Map,
    label: 'Digitální permanentka',
    description: 'Vstupy, kredit a docházka přehledně v telefonu — žádné papírové kartičky.',
  },
] as const;

export function AppShowcase() {
  return (
    <section className="relative overflow-hidden bg-brand-paper py-20 md:py-28">
      {/* Giant background word */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[30%] select-none text-center text-[20vw] font-black leading-none tracking-tighter text-brand-night/[0.03]">
        aplikace
      </div>

      <div className="section-shell relative grid items-center gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* Phone mockup — real screenshot of the app inside a CSS frame */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: -2 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease }}
          className="relative mx-auto w-[280px]"
        >
          <div className="relative aspect-[9/19] overflow-hidden rounded-[44px] border-[10px] border-brand-night bg-white shadow-[0_50px_110px_rgba(27,18,48,0.4)]">
            {/* notch */}
            <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-brand-night" />
            <Image
              src="/app-home-iphone-screen.png"
              alt="Skutečná obrazovka aplikace VYS — přehled účastníka s XP, náramkem a permanentkou"
              fill
              sizes="280px"
              className="object-cover object-top"
            />
          </div>

          {/* floating chip badge overlapping the phone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: 'spring', damping: 11 }}
            className="absolute -right-16 top-16 hidden items-center gap-2 rounded-full border border-brand-night/10 bg-white px-4 py-2 shadow-[0_16px_38px_rgba(27,18,48,0.15)] sm:flex"
          >
            <Smartphone size={14} className="text-brand-ember" />
            <span className="text-[11px] font-black text-brand-night">Expo · iOS i Android</span>
          </motion.div>
        </motion.div>

        {/* Copy + feature list */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease }}
            className="text-xs font-black uppercase tracking-[0.2em] text-brand-ember"
          >
            Mobilní aplikace
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.08, ease }}
            className="mt-3 text-3xl font-black leading-[1.05] tracking-tight text-brand-night md:text-5xl"
          >
            Trenéři i děti mají klub
            <span className="text-brand-ember"> v kapse</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.16, ease }}
            className="mt-5 max-w-[52ch] text-base font-bold leading-7 text-brand-night/60"
          >
            Tohle je skutečná obrazovka aplikace — žádná maketa. Docházka, progres a odměny okamžitě
            po ruce. Rodiče a administrace používají webový portál.
          </motion.p>

          <div className="mt-8 space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1, ease }}
                className="flex w-full items-start gap-4 rounded-[18px] border border-brand-ember/15 bg-white p-4 text-left shadow-[0_12px_32px_rgba(139,29,255,0.08)]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-gradient-ember text-white">
                  <feature.icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-black text-brand-night">{feature.label}</span>
                  <span className="mt-0.5 block text-xs font-bold leading-5 text-brand-night/50">{feature.description}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
