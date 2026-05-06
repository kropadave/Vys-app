'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Apple, Bell, Check, ExternalLink, Fingerprint, QrCode, RefreshCw, ShieldCheck, Smartphone, Sparkles, Trophy, Wifi } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AppInstallButton } from '@/components/app-install-button';

const easeBrand = [0.22, 1, 0.36, 1] as const;

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
  const [followPhone, setFollowPhone] = useState(false);
  const { scrollYProgress } = useScroll();
  const phoneY = useSpring(useTransform(scrollYProgress, [0, 0.22, 0.46], [0, 150, 330]), {
    stiffness: 82,
    damping: 24,
    mass: 0.45,
  });
  const phoneRotate = useTransform(scrollYProgress, [0, 0.3, 0.6], [0, -1.2, 1.4]);

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setFollowPhone(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

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
              Online aplikace TeamVYS <span className="gradient-text">rovnou v telefonu</span>.
            </h1>
            <p className="max-w-xl text-base font-bold text-brand-ink-soft md:text-lg">
              Než půjde Android verze do Google Play, funguje TeamVYS jako instalovatelná online aplikace. Běží přes web,
              ale chová se jako appka na ploše telefonu a načítá reálná data z backendu, Supabase a Stripe flow.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/sign-in?app=1"
                className="inline-flex items-center gap-2 rounded-brand bg-gradient-brand px-5 py-3.5 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-px"
              >
                <ExternalLink size={18} />
                Spustit online aplikaci
              </Link>
              <AppInstallButton />
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-brand border border-brand-purple/15 bg-white px-5 py-3.5 text-sm font-black text-brand-ink-soft opacity-80"
                title="APK build připravujeme"
              >
                <Smartphone size={18} />
                APK · připravujeme
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
              Na Androidu použij instalační tlačítko nebo nabídku prohlížeče. Na iPhonu použij Sdílet → Přidat na plochu.
              Jakmile bude hotové produkční APK/AAB, přidáme sem přímé stažení i Google Play.
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
            initial={{ opacity: 0, y: 48, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.0, ease: easeBrand, delay: 0.15 }}
            style={followPhone ? { y: phoneY, rotate: phoneRotate } : undefined}
            className="pointer-events-none relative mx-auto w-full max-w-[380px] will-change-transform lg:sticky lg:top-24 lg:max-w-[460px]"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' }}
            >
              <Image
                src="/telefon-mockup.png"
                alt="Ukázka aplikace TeamVYS v iPhonu"
                width={760}
                height={960}
                priority
                sizes="(min-width: 1024px) 460px, 90vw"
                className="w-full drop-shadow-[0_40px_80px_rgba(139,29,255,0.28)]"
              />
            </motion.div>
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
                  Otevři online aplikaci přes tlačítko výše a přihlas se rodičovským nebo admin účtem.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-black text-white">2</span>
                  Přidej si aplikaci na plochu telefonu, ať funguje jako samostatná ikona bez hledání v prohlížeči.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-black text-white">3</span>
                  Platby, dokumenty, účastníci a admin produkty se tahají z online backendu, takže rodič i admin vidí stejná data.
                </li>
              </ol>
            </div>
            <div className="space-y-3">
              <Link
                href="/sign-in?app=1"
                className="flex items-center justify-between gap-4 rounded-brand bg-brand-ink px-5 py-4 text-white shadow-brand-soft transition-transform hover:-translate-y-px"
              >
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-wider opacity-70">Aktuální verze</span>
                  <span className="text-base font-black">Online app · živá data</span>
                </span>
                <RefreshCw size={22} />
              </Link>
              <div className="rounded-brand border border-brand-purple/12 bg-white p-4 shadow-brand-soft">
                <div className="flex items-start gap-3">
                  <span className="rounded-[14px] bg-brand-purple-light p-2 text-brand-purple"><ShieldCheck size={18} /></span>
                  <p className="text-xs font-bold leading-6 text-brand-ink-soft">
                    Online verze necachuje API odpovědi. Data z plateb, dokumentů a produktů se vždy berou z aktuálního backendu.
                  </p>
                </div>
              </div>
              <p className="text-xs font-bold text-brand-ink-soft">
                Po vydání v Google Play půjde aplikace updatovat automaticky. Do té doby je nejjistější tahle online verze.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
