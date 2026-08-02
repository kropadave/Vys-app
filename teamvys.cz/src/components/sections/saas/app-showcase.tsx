'use client';

import { motion } from 'framer-motion';
import { BarChart3, CalendarCheck, Gift, QrCode, Route, Smartphone, Ticket, Trophy, Zap } from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;

const features = [
  {
    id: 'dochazka',
    icon: CalendarCheck,
    label: 'Docházka',
    description: 'Trenér přiloží NFC náramek nebo odklikne docházku ručně — rodič dostane notifikaci.',
  },
  {
    id: 'xp',
    icon: Trophy,
    label: 'XP a náramky',
    description: 'Děti sbírají XP za tréninky, postupují přes barevné náramky a otevírají bedny s odměnami.',
  },
  {
    id: 'permanentka',
    icon: Ticket,
    label: 'Digitální permanentka',
    description: 'Vstupy, kredit a docházka přehledně v telefonu — žádné papírové kartičky.',
  },
] as const;

/** Live render of the real participant "Přehled" screen — same layout as the app. */
function ParticipantScreen() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden bg-brand-paper px-3.5 pt-10">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <p className="text-lg font-black text-brand-ink">Přehled</p>
        <span className="h-7 w-7 rounded-full bg-gradient-brand" />
      </div>

      {/* hero card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="rounded-[20px] bg-gradient-brand p-3.5 text-white shadow-[0_14px_30px_rgba(139,29,255,0.35)]"
      >
        <span className="inline-flex rounded-full bg-white/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em]">
          Účastník
        </span>
        <p className="mt-2 text-lg font-black leading-tight">
          Eliška <span className="text-white/85">Nováková</span>
        </p>
        <p className="mt-1 text-[9px] font-bold leading-snug text-white/80">
          Náramek, permanentka a odměny na jednom místě.
        </p>

        <p className="mt-3 text-sm font-black leading-none">920 / 1400 XP</p>
        <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/80">Postup k dalšímu náramku</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
          <motion.div
            initial={{ width: '8%' }}
            animate={{ width: '66%' }}
            transition={{ delay: 0.3, duration: 1.1, ease }}
            className="h-full rounded-full bg-white"
          />
        </div>

        <div className="mt-3 grid grid-cols-[68px_1fr] gap-2">
          <div className="flex flex-col items-center justify-center rounded-[14px] bg-brand-ink py-2 text-white">
            <p className="text-[7px] font-black uppercase tracking-[0.16em] text-white/70">Level</p>
            <p className="text-2xl font-black leading-none">7</p>
          </div>
          <div className="flex items-center gap-2 rounded-[14px] bg-white px-3 py-2 text-brand-ink">
            <span className="h-5 w-5 shrink-0 rounded-full border-[3px] border-white bg-brand-pink shadow" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black leading-tight">Růžová</p>
              <p className="text-[7px] font-black uppercase tracking-[0.14em] text-brand-purple-deep">Aktuální náramek</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* stat row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Zap, value: '920', label: 'Celkem XP', color: 'text-brand-purple', soft: 'bg-brand-purple/10' },
          { icon: Ticket, value: '6', label: 'Vstupů zbývá', color: 'text-[#0E8FB8]', soft: 'bg-brand-cyan/12' },
          { icon: Gift, value: '480', label: 'XP k odměně', color: 'text-brand-pink', soft: 'bg-brand-pink/12' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.4, ease }}
            className="rounded-[14px] border border-brand-purple/10 bg-white px-1 py-2.5 text-center shadow-sm"
          >
            <span className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${stat.soft}`}>
              <stat.icon className={stat.color} size={12} />
            </span>
            <p className={`mt-1.5 text-lg font-black leading-none ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-[7px] font-black leading-tight text-brand-ink-soft">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* digital pass card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.45, ease }}
        className="rounded-[18px] border border-brand-cyan/25 bg-white p-3 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#0E8FB8]">Digitální permanentka</p>
            <p className="mt-1 text-base font-black leading-tight text-brand-ink">Permanentka 10 vstupů</p>
            <p className="text-[9px] font-extrabold text-brand-ink-soft">Vyškov · ZŠ Nádražní</p>
          </div>
          <span className="rounded-full border border-brand-mint/40 bg-brand-mint/15 px-2.5 py-1 text-[8px] font-black uppercase text-[#0E8FB8]">
            NFC
          </span>
        </div>
        <div className="mt-2.5 rounded-[12px] bg-brand-mint/10 p-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-brand-ink">4 z 10 vstupů</p>
            <p className="text-[11px] font-black text-[#0E8FB8]">40 %</p>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-mint/20">
            <motion.div
              initial={{ width: '4%' }}
              animate={{ width: '40%' }}
              transition={{ delay: 0.7, duration: 1, ease }}
              className="h-full rounded-full bg-[#0E8FB8]"
            />
          </div>
        </div>
      </motion.div>

      {/* floating tab bar */}
      <div className="mt-auto" />
      <div className="absolute inset-x-3.5 bottom-3 grid grid-cols-4 items-center rounded-[22px] border border-white/80 bg-white/70 px-2 py-2 shadow-[0_12px_30px_rgba(27,18,48,0.18)] backdrop-blur-xl">
        {[
          { icon: QrCode, active: true, color: 'from-brand-cyan to-brand-purple' },
          { icon: Gift, active: false, color: '' },
          { icon: Route, active: false, color: '' },
          { icon: BarChart3, active: false, color: '' },
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-center">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                item.active ? `bg-gradient-to-br ${item.color} text-white shadow` : 'bg-white/70 text-brand-ink-soft ring-1 ring-brand-ink/5'
              }`}
            >
              <item.icon size={17} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AppShowcase() {
  return (
    <section className="relative overflow-hidden bg-brand-paper py-20 md:py-28">
      {/* Giant background word */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[30%] select-none text-center text-[20vw] font-black leading-none tracking-tighter text-brand-night/[0.03]">
        aplikace
      </div>

      <div className="section-shell relative grid items-center gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* Phone mockup — live participant screen rendered as JSX */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: -2 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease }}
          className="relative mx-auto w-[280px]"
        >
          <div className="relative aspect-[9/19] overflow-hidden rounded-[44px] border-[10px] border-brand-night bg-brand-night shadow-[0_50px_110px_rgba(27,18,48,0.4)]">
            {/* notch */}
            <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-brand-night" />
            <div className="absolute inset-0">
              <ParticipantScreen />
            </div>
          </div>

          {/* floating chip badge overlapping the phone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: 'spring', damping: 11 }}
            className="absolute -right-16 top-16 hidden items-center gap-2 rounded-full border border-brand-night/10 bg-white px-4 py-2 shadow-[0_16px_38px_rgba(27,18,48,0.15)] sm:flex"
          >
            <Smartphone size={14} className="text-brand-ember" />
            <span className="text-[11px] font-black text-brand-night">Expo · iOS i Android</span>
          </motion.div>
        </motion.div>

        {/* Copy + feature list */}
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease }}
            className="text-xs font-black uppercase tracking-[0.2em] text-brand-ember"
          >
            Mobilní aplikace
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.08, ease }}
            className="mt-3 text-3xl font-black leading-[1.05] tracking-tight text-brand-night md:text-5xl"
          >
            Trenéři i děti mají klub
            <span className="text-brand-ember"> v kapse</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.16, ease }}
            className="mt-5 max-w-[52ch] text-base font-bold leading-7 text-brand-night/60"
          >
            Přesně takhle vypadá aplikace — docházka, progres i odměny po ruce. Rodiče a administrace
            používají webový portál.
          </motion.p>

          <div className="mt-8 space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1, ease }}
                className="flex w-full items-start gap-4 rounded-[18px] border border-brand-ember/15 bg-white p-4 text-left shadow-[0_12px_32px_rgba(139,29,255,0.08)]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-gradient-ember text-white">
                  <feature.icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-black text-brand-night">{feature.label}</span>
                  <span className="mt-0.5 block text-xs font-bold leading-5 text-brand-night/50">{feature.description}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
