'use client';

import { motion, useInView } from 'framer-motion';
import { Activity, MapPin, Sparkles, Trophy } from 'lucide-react';
import { useRef } from 'react';

import { AnimatedStatValue } from '@/components/animated/animated-counter';
import { Reveal } from '@/components/animated/reveal';
import { useAdminCreatedProducts } from '@/lib/admin-created-products';
import { publicStatCards } from '@/lib/public-product-summary';

const icons = [Activity, MapPin, Sparkles, Trophy];
const statEase = [0.22, 1, 0.36, 1] as const;

const statsGridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const statCardVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.56, ease: statEase } },
};

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-90px' });
  const { products, loading } = useAdminCreatedProducts();
  const stats = publicStatCards(products, loading);

  return (
    <section ref={sectionRef} className="section-shell py-14 md:py-16">
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <Reveal>
          <div>
            <p className="text-xs font-black uppercase text-brand-cyan">TeamVYS v číslech</p>
            <h2 className="mt-3 text-2xl font-black leading-tight text-brand-ink sm:text-3xl md:text-5xl">
              Děti rostou, rodiče mají přehled.
            </h2>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <p className="max-w-[620px] text-[15px] leading-7 text-brand-ink-soft lg:ml-auto">
            Nový web ukazuje nabídku, ale zároveň drží praktickou část projektu: platby, dokumenty, docházku a přístup pro rodiče i admina.
          </p>
        </Reveal>
      </div>

      <motion.div
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={statsGridVariants}
        className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {stats.map((stat, index) => {
          const Icon = icons[index % icons.length];
          return (
            <motion.div
              key={stat.label}
              variants={statCardVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="group relative overflow-hidden rounded-[24px] border border-brand-purple/12 bg-white p-5 shadow-brand-soft"
            >
              <div aria-hidden className="absolute inset-0 bg-gradient-brand opacity-0 transition-opacity duration-300 group-hover:opacity-[0.035]" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-[14px] bg-brand-purple text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                <Icon size={18} />
              </div>
              <span className="relative mt-4 block text-brand-ink">
                <AnimatedStatValue value={stat.value} delay={index * 100} className="text-3xl font-black sm:text-4xl md:text-5xl" />
              </span>
              <p className="relative mt-1.5 text-xs font-bold leading-5 text-brand-ink-soft sm:text-sm">{stat.label}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
