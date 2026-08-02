'use client';

import { motion } from 'framer-motion';
import { Dumbbell, Music4, PersonStanding, Swords } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

const audiences = [
  { icon: Dumbbell, title: 'Sportovní kluby', body: 'Parkour, atletika, fotbal, florbal — každý dětský oddíl s tréninky a docházkou.' },
  { icon: Swords, title: 'Bojová umění', body: 'Judo, karate, MMA školy — páskování a postup mapovaný na XP a levely.' },
  { icon: Music4, title: 'Taneční školy', body: 'Kurzy, skupiny a vystoupení s přehledem plateb pro rodiče.' },
  { icon: PersonStanding, title: 'Gymnastika', body: 'Oddíly všech velikostí — od přípravky po závodní skupiny.' },
] as const;

export function AudienceSection() {
  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-28">
      <div className="section-shell">
        {/* Asymmetric header: eyebrow left, headline pushed right */}
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <motion.p
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease }}
            className="text-xs font-black uppercase tracking-[0.2em] text-brand-ember"
          >
            Pro koho je platforma
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease }}
            className="text-3xl font-black leading-[1.05] tracking-tight text-brand-night md:text-5xl"
          >
            Každá dětská sportovní organizace v Česku,
            <span className="text-brand-ember"> která chce fungovat moderně</span>
          </motion.h2>
        </div>

        {/* Staggered cards — alternating vertical offsets, not a flat row */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((audience, index) => (
            <motion.article
              key={audience.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: index * 0.09, ease }}
              className={`rounded-[22px] border border-brand-night/[0.07] bg-brand-paper p-6 shadow-[0_18px_44px_rgba(26,26,46,0.07)] transition-transform duration-300 hover:-translate-y-1.5 ${index % 2 === 1 ? 'lg:translate-y-8' : ''}`}
            >
              <span className="grid h-12 w-12 place-items-center rounded-[16px] bg-gradient-ember text-white shadow-[0_10px_24px_rgba(139,29,255,0.3)]">
                <audience.icon size={22} />
              </span>
              <h3 className="mt-5 text-lg font-black text-brand-night">{audience.title}</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-brand-night/55">{audience.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
