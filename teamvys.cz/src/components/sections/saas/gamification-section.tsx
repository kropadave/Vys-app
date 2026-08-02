'use client';

import { motion } from 'framer-motion';
import { Gift, Map, Swords, TrendingUp } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

const gamificationItems = [
  { icon: TrendingUp, title: 'XP a levely', body: 'Každý trénink přidává XP. Děti vidí progres a chtějí se vracet.' },
  { icon: Gift, title: 'Maskoti a bedny', body: 'Levelování maskotů a otevírání beden s odměnami za docházku.' },
  { icon: Swords, title: 'Arény', body: 'Týmové výzvy mezi skupinami — trénink jako turnaj.' },
  { icon: Map, title: 'Společná questová mapa', body: 'Jedna mapa výprav sdílená všemi organizacemi na platformě. Váš klub je součástí většího příběhu.' },
] as const;

export function GamificationSection() {
  return (
    <section className="relative overflow-hidden bg-brand-night py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[20%] top-[-25%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,rgba(139,29,255,0.20)_0%,transparent_70%)]" />
        <div className="absolute bottom-[-20%] right-[5%] h-[45vh] w-[45vh] rounded-full bg-[radial-gradient(circle,rgba(241,43,179,0.12)_0%,transparent_70%)]" />
      </div>

      {/* Asymmetric: copy right, cards left & overlapping */}
      <div className="section-shell relative grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
        <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
          {gamificationItems.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease }}
              className={`rounded-[22px] border border-white/[0.08] bg-white/[0.05] p-6 backdrop-blur-md transition-colors duration-300 hover:border-brand-pink/40 ${index % 2 === 1 ? 'sm:translate-y-6' : ''}`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-[15px] bg-white/[0.08] text-brand-pink">
                <item.icon size={20} />
              </span>
              <h3 className="mt-4 text-base font-black text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm font-bold leading-6 text-white/55">{item.body}</p>
            </motion.article>
          ))}
        </div>

        <div className="order-1 lg:order-2">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease }}
            className="text-xs font-black uppercase tracking-[0.2em] text-brand-ember"
          >
            Gamifikace
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.08, ease }}
            className="mt-3 text-3xl font-black leading-[1.05] tracking-tight text-white md:text-5xl"
          >
            Děti nechodí na trénink.
            <br />
            <span className="bg-gradient-ember bg-clip-text text-transparent">Hrají ho.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.16, ease }}
            className="mt-5 max-w-[48ch] text-base font-bold leading-7 text-white/60"
          >
            Vyladěný herní systém, který jsme roky testovali na vlastních trénincích. Docházka roste,
            protože děti chtějí svůj další level — a rodiče to vidí.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
