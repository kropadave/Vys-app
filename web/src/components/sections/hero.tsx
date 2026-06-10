'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const ease = [0.22, 1, 0.36, 1] as const;

const item = {
  hidden: { opacity: 0, y: 32 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.72, delay: d, ease } }),
};

export function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#080412' }}>
      <div aria-hidden className="absolute inset-x-0 top-0 z-20 h-[2px] bg-white" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 z-20 h-[2px] bg-white" />
      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[20%] top-[-10%] h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(circle,rgba(139,29,255,0.28)_0%,transparent_70%)]" />
        <div className="absolute -right-[15%] top-[10%] h-[50vh] w-[50vh] rounded-full bg-[radial-gradient(circle,rgba(241,43,179,0.18)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-[30%] h-[40vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(255,178,26,0.1)_0%,transparent_70%)]" />
      </div>

      {/* Subtle grid */}
      <div aria-hidden className="absolute inset-0 [background-image:linear-gradient(rgba(139,29,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(139,29,255,0.07)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />

      <div className="section-shell relative py-32 text-center md:py-44 lg:py-48">
        {/* Big headline */}
        <motion.h1
          initial="hidden"
          animate="visible"
          variants={item}
          custom={0}
          className="mx-auto max-w-[13ch] text-[clamp(3.6rem,10vw,9rem)] font-black leading-[0.9] tracking-[-0.045em] text-white"
        >
          Sport je hra
          <br />
          <span className="gradient-text">Hra je sport</span>
        </motion.h1>

        {/* CTAs */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={item}
          custom={0.24}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/krouzky"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-brand px-7 text-sm font-bold text-white shadow-[0_12px_30px_rgba(139,29,255,0.34)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(139,29,255,0.44)]"
          >
            Vybrat kroužek
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/tabory"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-full border border-transparent bg-[linear-gradient(rgba(255,255,255,0.06),rgba(255,255,255,0.06))_padding-box,linear-gradient(135deg,#8B1DFF,#F12BB3,#FFB21A)_border-box] px-7 text-sm font-bold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[linear-gradient(rgba(255,255,255,0.09),rgba(255,255,255,0.09))_padding-box,linear-gradient(135deg,#8B1DFF,#F12BB3,#FFB21A)_border-box]"
          >
            Vybrat tábor
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
