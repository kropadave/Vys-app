'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, CalendarDays, Sparkles, Star, Zap } from 'lucide-react';
import Link from 'next/link';

import { AnimatedStatValue } from '@/components/animated/animated-counter';
import { MascotReveal } from '@/components/brand/mascot-reveal';
import { VysMaskotImage } from '@/components/brand/vys-maskot';
import { useAdminCreatedProducts } from '@/lib/admin-created-products';
import { publicStatCards } from '@/lib/public-product-summary';
import { heroBullets } from '@shared/content';

const heroEase = [0.22, 1, 0.36, 1] as const;

const heroItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.68, delay, ease: heroEase },
  }),
};

const heroMascotVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.82, delay: 0.16, ease: heroEase },
  },
};

const mobileHeroStageVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 18 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.72, ease: heroEase },
  },
};

export function Hero() {
  const { products, loading } = useAdminCreatedProducts();
  const stats = publicStatCards(products, loading);

  return (
    <section className="section-shell relative mt-4 overflow-hidden rounded-[30px] border border-brand-purple/12 bg-white text-brand-ink shadow-brand-float sm:mt-6">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-brand" />
      <div aria-hidden className="absolute inset-0 diagonal-rails opacity-[0.035]" />

      <div className="relative grid gap-6 p-5 sm:p-7 md:min-h-[calc(100vh-48px)] md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-10 md:p-10">
        <div className="flex max-w-[740px] flex-col justify-center md:py-10">
          <motion.div initial="hidden" animate="visible" variants={mobileHeroStageVariants} className="relative mb-6 overflow-hidden rounded-[26px] border border-brand-purple/15 bg-brand-ink text-white shadow-brand-float md:hidden">
            <div aria-hidden className="mobile-hero-energy absolute inset-0" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0)_42%)]" />
            <div className="relative h-[236px] overflow-hidden">
              <div aria-hidden className="mobile-hero-ring absolute left-1/2 top-9 h-40 w-40 -translate-x-1/2 rounded-full border border-white/18" />
              <div aria-hidden className="mobile-hero-ring mobile-hero-ring-slow absolute left-1/2 top-3 h-52 w-52 -translate-x-1/2 rounded-full border border-brand-orange/25" />
              <div aria-hidden className="mobile-hero-trail absolute bottom-11 left-4 right-4 h-12 rounded-full bg-white/10 blur-2xl" />

              <motion.div
                animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-[-12px] left-[49%] z-30 w-[178px] -translate-x-1/2 drop-shadow-[0_24px_32px_rgba(0,0,0,0.34)]"
              >
                <VysMaskotImage src="/vys-maskot-no-logo.png" priority sizes="180px" />
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0], x: [0, 4, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-4 top-6 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/14 px-3 py-2 text-[11px] font-black uppercase tracking-wide backdrop-blur-md"
              >
                <Sparkles size={13} />
                Flow
              </motion.div>
              <motion.div
                animate={{ y: [0, 9, 0], x: [0, -5, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute right-4 bottom-[72px] z-20 inline-flex items-center gap-1.5 rounded-full border border-white/18 bg-white/14 px-3 py-2 text-[11px] font-black uppercase tracking-wide backdrop-blur-md"
              >
                <Zap size={13} />
                Trik
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, -4, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-12 left-5 z-20 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-orange/30 bg-brand-orange/20 text-brand-orange shadow-[0_14px_32px_rgba(255,178,26,0.18)] backdrop-blur-md"
              >
                <Star size={22} fill="currentColor" />
              </motion.div>
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-10 right-5 z-20 rounded-2xl border border-white/18 bg-white/14 px-3 py-2 text-center text-xs font-black backdrop-blur-md"
              >
                +XP
              </motion.div>
            </div>
            <div className="relative flex items-center justify-between gap-3 border-t border-white/10 bg-white/[0.08] px-4 py-3 backdrop-blur-md">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-white/78">TeamVYS</span>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wide text-brand-purple-deep">parkour energie</span>
            </div>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={heroItemVariants} custom={0.02}>
            <span className="inline-flex w-max items-center gap-2 rounded-[18px] bg-brand-purple-light px-3 py-2 text-xs font-black uppercase text-brand-purple-deep">
              <BadgeCheck size={14} />
              Parkour pro děti 6–16 let
            </span>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={heroItemVariants} custom={0}>
            <h1 className="mt-4 text-[34px] font-black leading-[1.05] text-brand-ink sm:text-[44px] md:text-6xl lg:text-7xl">
              TeamVYS dává dětem odvahu v&nbsp;pohybu
            </h1>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={heroItemVariants} custom={0.1}>
            <p className="mt-3 max-w-[580px] text-[15px] leading-7 text-brand-ink-soft md:mt-5 md:text-lg">
              Pravidelné kroužky, tábory a workshopy s trenéry, kteří drží bezpečný postup. Rodič má platby, docházku i progres dítěte v digitálním systému.
            </p>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={heroItemVariants} custom={0.2}>
            <div className="mt-5 flex flex-wrap items-center gap-3 md:mt-7">
              <Link
                href="/krouzky"
                className="inline-flex items-center gap-2 rounded-[18px] bg-gradient-brand px-5 py-3.5 text-sm font-black text-white shadow-brand-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-brand active:scale-95 sm:py-4"
              >
                Vybrat kroužek
                <ArrowRight size={17} />
              </Link>
              <Link
                href="/tabory"
                className="inline-flex items-center gap-2 rounded-[18px] border border-brand-purple/15 bg-brand-paper px-5 py-3.5 text-sm font-black text-brand-ink transition-all duration-300 hover:bg-brand-purple-light active:scale-95 sm:py-4"
              >
                Tábory 2026
                <CalendarDays size={17} />
              </Link>
            </div>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={heroItemVariants} custom={0.3}>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-3 md:mt-8">
              {heroBullets.map((bullet) => (
                <div key={bullet} className="border-l-2 border-brand-pink/70 pl-3 text-sm font-bold leading-6 text-brand-ink-soft">
                  {bullet}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="hidden items-center justify-center md:flex md:py-10">
          <motion.div initial="hidden" animate="visible" variants={heroMascotVariants} className="mascot-float w-[min(36vw,430px)] drop-shadow-[0_40px_50px_rgba(83,36,140,0.22)]">
            <MascotReveal frontSrc="/vys-maskot-no-logo.png" priority sizes="(max-width: 1280px) 36vw, 430px" initialRevealX="57%" initialRevealY="34%" shapeScale={0.95} />
          </motion.div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative grid grid-cols-2 border-t border-brand-purple/10 bg-brand-paper md:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`px-5 py-4 md:px-6 md:py-5 ${i < 2 ? 'border-b border-brand-purple/10 md:border-b-0' : ''} ${i % 2 === 0 ? 'border-r border-brand-purple/10' : ''} md:border-r md:last:border-r-0`}
          >
            <p className="text-2xl font-black gradient-text md:text-3xl">
              <AnimatedStatValue value={stat.value} delay={i * 80} />
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-brand-ink-soft md:text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
