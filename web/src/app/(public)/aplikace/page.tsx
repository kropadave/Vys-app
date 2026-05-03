'use client';

import { motion } from 'framer-motion';
import { Apple, Bell, Check, Download, Fingerprint, QrCode, Smartphone, Sparkles, Trophy } from 'lucide-react';
import Link from 'next/link';

import { TeamVysLogo } from '@/components/brand/team-vys-logo';

const easeBrand = [0.22, 1, 0.36, 1] as const;

const featurePills = [
  { icon: Trophy, label: 'Skill tree a XP' },
  { icon: QrCode, label: 'QR triky a NFC' },
  { icon: Bell, label: 'Push notifikace' },
  { icon: Fingerprint, label: 'Trenérská docházka' },
] as const;

const audiences = [
  {
    title: 'Účastník',
    accent: 'from-brand-cyan to-brand-purple',
    bullets: [
      'Skill tree, XP a animovaný progres náramků',
      'Digitální permanentka přes NFC čip',
      'Notifikace o dalším tréninku a odměnách',
    ],
  },
  {
    title: 'Trenér',
    accent: 'from-brand-pink to-brand-orange',
    bullets: [
      'Docházka přes NFC i ručně, kontrola lokality',
      'QR potvrzení splněných triků',
      'Přehled výplaty, bonusů a DPP dokumentů',
    ],
  },
] as const;

export default function AplikacePage() {
  return (
    <div className="relative">
      <section className="section-shell pt-10 pb-16 md:pt-16 md:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeBrand }}
            className="space-y-6"
          >
            <span className="inline-flex items-center gap-2 rounded-brand bg-brand-purple-light px-3 py-1.5 text-xs font-black uppercase tracking-wider text-brand-purple">
              <Sparkles size={14} /> TeamVYS aplikace
            </span>
            <h1 className="text-4xl font-black leading-[1.05] text-brand-ink md:text-6xl">
              Stáhni si aplikaci pro <span className="gradient-text">trenéra a účastníka</span>.
            </h1>
            <p className="max-w-xl text-base font-bold text-brand-ink-soft md:text-lg">
              Mobilní aplikace funguje přímo na telefonu — najdeš v ní skill tree, NFC permanentku, QR triky a celý
              trenérský přehled. Webový portál slouží rodičům a administraci, aplikace je pro děti a trenéry v terénu.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="/downloads/teamvys.apk"
                className="inline-flex items-center gap-2 rounded-brand bg-gradient-brand px-5 py-3.5 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-px"
              >
                <Download size={18} />
                Stáhnout APK (Android)
              </a>
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-brand border border-brand-purple/15 bg-white px-5 py-3.5 text-sm font-black text-brand-ink-soft opacity-80"
                title="Brzy v Google Play"
              >
                <Smartphone size={18} />
                Brzy v Google Play
              </button>
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-brand border border-brand-purple/15 bg-white px-5 py-3.5 text-sm font-black text-brand-ink-soft opacity-80"
                title="iOS verze v přípravě"
              >
                <Apple size={18} />
                iOS · v přípravě
              </button>
            </div>

            <p className="text-xs font-bold text-brand-ink-soft">
              Aplikace se neotevírá v prohlížeči — nainstaluj si ji do telefonu. Aktuálně .apk přímo z webu, brzy přes
              Google Play.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              {featurePills.map((pill) => (
                <span
                  key={pill.label}
                  className="inline-flex items-center gap-2 rounded-brand border border-brand-purple/12 bg-white px-3 py-2 text-xs font-black text-brand-ink shadow-brand-soft"
                >
                  <pill.icon size={14} className="text-brand-purple" />
                  {pill.label}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: easeBrand, delay: 0.1 }}
            className="relative mx-auto w-full max-w-[360px]"
          >
            <div className="relative rounded-[42px] border border-brand-ink/10 bg-gradient-to-b from-brand-ink to-[#241733] p-3 shadow-brand-float">
              <div className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-brand-purple via-brand-pink to-brand-orange p-6 text-white">
                <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
                <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-brand-cyan/30 blur-2xl" />
                <div className="relative z-10 flex items-center gap-3">
                  <TeamVysLogo size={28} />
                  <span className="text-sm font-black uppercase tracking-wider">TeamVYS</span>
                </div>
                <div className="relative z-10 mt-8 space-y-4">
                  <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-md">
                    <p className="text-xs font-black uppercase tracking-wider opacity-80">Účastník</p>
                    <p className="mt-1 text-2xl font-black">Eliška Nováková</p>
                    <p className="text-xs font-bold opacity-80">Růžová · level 7 · 920 XP</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-md">
                    <p className="text-xs font-black uppercase tracking-wider opacity-80">Permanentka</p>
                    <p className="mt-1 text-base font-black">6 / 10 vstupů</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '60%' }}
                        transition={{ duration: 1.4, ease: easeBrand, delay: 0.4 }}
                        className="h-full rounded-full bg-white"
                      />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-md">
                    <p className="text-xs font-black uppercase tracking-wider opacity-80">Další trénink</p>
                    <p className="mt-1 text-base font-black">Středa 16:30</p>
                    <p className="text-xs font-bold opacity-80">Vyškov · ZŠ Nádražní</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white/60 py-16 backdrop-blur">
        <div className="section-shell grid gap-6 md:grid-cols-2">
          {audiences.map((role, idx) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: easeBrand, delay: idx * 0.1 }}
              className="relative overflow-hidden rounded-brand-lg border border-brand-purple/12 bg-white p-7 shadow-brand-soft"
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${role.accent}`} />
              <p className="text-xs font-black uppercase tracking-wider text-brand-purple">Pro {role.title.toLowerCase()}a</p>
              <h2 className="mt-1 text-3xl font-black text-brand-ink">{role.title}</h2>
              <ul className="mt-5 space-y-3">
                {role.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple-light text-brand-purple">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span className="text-sm font-bold text-brand-ink-soft">{bullet}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section-shell py-16">
        <div className="rounded-brand-lg border border-brand-purple/12 bg-gradient-to-br from-white via-white to-brand-purple-light p-8 md:p-12 shadow-brand-soft">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <h2 className="text-3xl font-black text-brand-ink md:text-4xl">Jak to funguje?</h2>
              <ol className="mt-5 space-y-4 text-sm font-bold text-brand-ink-soft md:text-base">
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-black text-white">1</span>
                  Stáhni APK přes tlačítko výše a povol instalaci v nastavení telefonu.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-black text-white">2</span>
                  Přihlas se účastnickým nebo trenérským kódem — data se sdílí s rodičovským portálem.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-black text-white">3</span>
                  V terénu používej NFC docházku, QR triky a sleduj progres v reálném čase.
                </li>
              </ol>
            </div>
            <div className="space-y-3">
              <Link
                href="/downloads/teamvys.apk"
                className="flex items-center justify-between gap-4 rounded-brand bg-brand-ink px-5 py-4 text-white shadow-brand-soft transition-transform hover:-translate-y-px"
              >
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-wider opacity-70">Aktuální verze</span>
                  <span className="text-base font-black">teamvys.apk · 1.0.0</span>
                </span>
                <Download size={22} />
              </Link>
              <p className="text-xs font-bold text-brand-ink-soft">
                Po vydání v Google Play půjde aplikace updatovat automaticky. Zatím prosím stahujte ručně.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
