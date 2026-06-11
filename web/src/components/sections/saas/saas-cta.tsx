'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

const ease = [0.22, 1, 0.36, 1] as const;

export function SaasCta() {
  return (
    <section className="relative overflow-hidden bg-brand-night py-24 md:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(232,68,10,0.18)_0%,transparent_65%)]" />
      </div>
      <div aria-hidden className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black,transparent)]" />

      <div className="section-shell relative text-center">
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.75, ease }}
          className="mx-auto max-w-[18ch] text-[clamp(2.4rem,6vw,4.8rem)] font-black leading-[1.02] tracking-[-0.03em] text-white"
        >
          Začněte vést klub
          <span className="bg-gradient-ember bg-clip-text text-transparent"> jako v roce 2026</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.12, ease }}
          className="mx-auto mt-5 max-w-[44ch] text-base font-bold leading-7 text-white/60"
        >
          Registrace zabere pět minut. Prvních 30 dní neplatíte nic a NFC čipy vám pošleme poštou.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.65, delay: 0.22, ease }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/registrace-organizace"
            className="group inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-gradient-ember px-8 text-sm font-black text-white shadow-[0_16px_44px_rgba(232,68,10,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(232,68,10,0.55)]"
          >
            Vyzkoušet 30 dní zdarma
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/kontakty"
            className="inline-flex h-[52px] items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-8 text-sm font-black text-white backdrop-blur-md transition-all duration-200 hover:bg-white/[0.1]"
          >
            Napsat nám
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
