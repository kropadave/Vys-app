'use client';

import { motion } from 'framer-motion';
import { Apple, Check, Play } from 'lucide-react';
import Image from 'next/image';

const ease = [0.22, 1, 0.36, 1] as const;

const audiences = [
  {
    title: 'Účastník',
    label: 'pro dítě',
    bullets: [
      'Skill tree, XP a animovaný progres náramků',
      'Digitální permanentka přes NFC čip',
      'Notifikace o dalším tréninku a odměnách',
    ],
  },
  {
    title: 'Rodič',
    label: 'pro rodiče',
    bullets: [
      'Přehled dětí, docházky a aktivních nákupů',
      'Platby kroužků, táborů a workshopů online',
      'Správa organizací, profilu a hodnocení trenérů',
    ],
  },
  {
    title: 'Trenér',
    label: 'pro trenéra',
    bullets: [
      'Docházka přes NFC i ručně, kontrola lokality',
      'QR potvrzení splněných triků',
      'Přehled výplaty, bonusů a DPP dokumentů',
    ],
  },
] as const;

const steps = [
  'Stáhni si aplikaci z App Store nebo Google Play a přihlas se jako účastník, rodič nebo trenér.',
  'Aplikaci najdeš rovnou na ploše telefonu — žádné hledání v prohlížeči ani přihlašování přes web.',
  'Účastník vidí progres, rodič spravuje děti a platby, trenér řeší docházku a QR potvrzení triků.',
] as const;

export default function AplikacePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-black/[0.06] bg-white pt-28 md:pt-32">
        <div className="section-shell grid items-center gap-12 pb-16 md:pb-20 lg:grid-cols-[1fr_360px]">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="text-xs font-bold uppercase tracking-[0.2em] text-brand-purple"
            >
              Aplikace
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.06, ease }}
              className="mt-4 max-w-[14ch] text-4xl font-black leading-[1.05] tracking-tight text-brand-ink md:text-6xl"
            >
              Celý TeamVYS v telefonu
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12, ease }}
              className="mt-5 max-w-[520px] text-base leading-7 text-neutral-500 md:text-lg"
            >
              Účastníci sledují progres, rodiče řeší platby a správu dětí, trenéři odbavují docházku i QR triky.
            </motion.p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <StoreButton store="apple" />
              <StoreButton store="google" />
            </div>
            <p className="mt-4 text-xs font-medium text-neutral-400">
              Odkazy ke stažení doplníme po vydání na App Store a Google Play.
            </p>
          </div>

          <div className="pointer-events-none relative mx-auto w-full max-w-[300px] lg:max-w-[360px]">
            <Image
              src="/telefon-mockup.png"
              alt="Ukázka aplikace TeamVYS v iPhonu"
              width={760}
              height={960}
              priority
              sizes="(min-width: 1024px) 360px, 80vw"
              className="w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.14)]"
            />
          </div>
        </div>
      </section>

      {/* Pro koho */}
      <section className="section-shell py-16 md:py-20">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-purple">Pro všechny</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-brand-ink md:text-4xl">Jedna aplikace, tři pohledy</h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {audiences.map((role, index) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-70px' }}
              transition={{ duration: 0.5, delay: index * 0.08, ease }}
              className="rounded-2xl border border-black/[0.08] bg-white p-6 md:p-7"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-brand-purple">{role.label}</p>
              <h3 className="mt-1 text-2xl font-black text-brand-ink">{role.title}</h3>
              <ul className="mt-5 space-y-3">
                {role.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="text-sm leading-6 text-neutral-600">{bullet}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Jak to funguje */}
      <section className="section-shell pb-16 md:pb-24">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-purple">Jak to funguje</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-brand-ink md:text-4xl">Tři kroky a jedeš</h2>

        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step} className="rounded-2xl border border-black/[0.08] bg-white p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-purple text-sm font-black text-white">
                {index + 1}
              </span>
              <p className="mt-4 text-sm leading-6 text-neutral-600">{step}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function StoreButton({ store }: { store: 'apple' | 'google' }) {
  const isApple = store === 'apple';
  return (
    <button
      type="button"
      className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-ink px-6 py-3.5 text-left text-white transition-transform hover:-translate-y-0.5 sm:w-auto"
      aria-label={isApple ? 'Stáhnout na App Store (již brzy)' : 'Stáhnout na Google Play (již brzy)'}
    >
      {isApple ? <Apple size={24} /> : <Play size={22} className="fill-white" />}
      <span className="leading-tight">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/60">
          {isApple ? 'Stáhnout na' : 'K dispozici na'}
        </span>
        <span className="block text-base font-black">{isApple ? 'App Store' : 'Google Play'}</span>
      </span>
    </button>
  );
}
