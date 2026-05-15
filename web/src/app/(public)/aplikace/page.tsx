'use client';

import { motion } from 'framer-motion';
import { Bell, Check, ExternalLink, Fingerprint, QrCode, ShieldCheck, Sparkles, Trophy, Wifi } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const easeBrand = [0.22, 1, 0.36, 1] as const;
const appUrl = 'https://vys-expo-web-export.vercel.app/sign-in';

const featurePills = [
  { icon: Wifi, label: 'Online data ze Supabase' },
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
      <section className="bg-gradient-to-b from-white via-brand-paper to-white py-10 md:py-14 lg:py-16">
        <div className="section-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          <div className="grid gap-8 lg:gap-10">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeBrand }}
              className="max-w-[820px] space-y-6"
            >
              <span className="inline-flex items-center gap-2 rounded-brand bg-brand-purple-light px-3 py-1.5 text-xs font-black uppercase tracking-wider text-brand-purple">
                <Sparkles size={14} /> TeamVYS aplikace
              </span>
              <h1 className="text-4xl font-black leading-[1.05] text-brand-ink md:text-6xl">
                Aplikace pro účastníky a trenéry <span className="gradient-text">rovnou v telefonu</span>.
              </h1>
              <p className="max-w-2xl text-base font-bold text-brand-ink-soft md:text-lg">
                TeamVYS aplikace je jen pro účastníky a trenéry v terénu. Děti v ní sledují progres, trenéři řeší docházku,
                QR triky a přehled práce. Rodiče a administrace zůstávají ve webovém portálu.
              </p>

              <Link
                href={appUrl}
                className="inline-flex items-center gap-2 rounded-brand bg-gradient-brand px-5 py-3.5 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-px"
              >
                <ExternalLink size={18} />
                Spustit aplikaci
              </Link>

              <p className="max-w-2xl text-xs font-bold text-brand-ink-soft">
                Instalovatelná část běží jako samostatná Expo PWA, takže ikona na ploše otevírá jen účastnickou a trenérskou appku.
                Webové profily pro rodiče a adminy se používají dál přes běžný web TeamVYS.
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

            <div className="grid gap-5">
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

            <div className="rounded-brand-lg border border-brand-purple/12 bg-white p-8 shadow-brand-soft md:p-10">
              <h2 className="text-3xl font-black text-brand-ink md:text-4xl">Jak to funguje?</h2>
              <ol className="mt-5 space-y-4 text-sm font-bold text-brand-ink-soft md:text-base">
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-black text-white">1</span>
                  Otevři aplikaci přes tlačítko výše a přihlas se jako účastník nebo trenér.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-black text-white">2</span>
                  Přidej si aplikaci na plochu telefonu, ať funguje jako samostatná ikona bez hledání v prohlížeči.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-black text-white">3</span>
                  Účastník vidí progres a náramky, trenér řeší docházku, QR potvrzení triků a svůj přehled.
                </li>
              </ol>
              <div className="mt-6 flex items-start gap-3 rounded-brand bg-brand-purple-light p-4">
                <span className="rounded-[14px] bg-white p-2 text-brand-purple"><ShieldCheck size={18} /></span>
                <p className="text-xs font-bold leading-6 text-brand-ink-soft">
                  Aplikace necachuje API odpovědi. Docházka, QR triky a progres se berou z aktuálního backendu.
                </p>
              </div>
            </div>
          </div>

          <div className="pointer-events-none relative mx-auto w-full max-w-[360px] lg:sticky lg:top-24 lg:max-w-[420px] lg:self-start lg:pt-3">
            <Image
              src="/telefon-mockup.png"
              alt="Ukázka aplikace TeamVYS v iPhonu"
              width={760}
              height={960}
              priority
              sizes="(min-width: 1024px) 420px, 90vw"
              className="w-full drop-shadow-[0_40px_80px_rgba(139,29,255,0.28)]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
