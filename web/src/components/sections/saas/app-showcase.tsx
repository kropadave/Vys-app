'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, Map, Smartphone, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

const ease = [0.22, 1, 0.36, 1] as const;
const SCREEN_INTERVAL_MS = 3400;

const screens = [
  {
    id: 'dochazka',
    icon: CalendarCheck,
    label: 'Docházka',
    description: 'Trenér přiloží NFC náramek nebo odklikne docházku ručně — rodič dostane notifikaci.',
  },
  {
    id: 'xp',
    icon: Trophy,
    label: 'XP a maskoti',
    description: 'Děti sbírají XP za tréninky, levelují maskoty a otevírají bedny s odměnami.',
  },
  {
    id: 'mapa',
    icon: Map,
    label: 'Questová mapa',
    description: 'Společná mapa výprav sdílená napříč všemi organizacemi na platformě.',
  },
] as const;

function DochazkaScreen() {
  return (
    <div className="flex h-full flex-col gap-2.5 p-4">
      <p className="text-[11px] font-black uppercase tracking-wider text-white/50">Dnes · 16:30</p>
      <p className="text-base font-black text-white">Parkour začátečníci</p>
      {[
        { name: 'Eliška N.', state: 'NFC ✓' },
        { name: 'Matyáš K.', state: 'NFC ✓' },
        { name: 'Anežka P.', state: 'ručně ✓' },
        { name: 'Tobiáš R.', state: '—' },
      ].map((row, index) => (
        <motion.div
          key={row.name}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + index * 0.12, duration: 0.4, ease }}
          className="flex items-center justify-between rounded-[12px] bg-white/[0.07] px-3 py-2.5"
        >
          <span className="text-xs font-bold text-white/85">{row.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${row.state === '—' ? 'bg-white/[0.08] text-white/35' : 'bg-emerald-400/15 text-emerald-300'}`}>
            {row.state}
          </span>
        </motion.div>
      ))}
      <div className="mt-auto rounded-[12px] bg-gradient-ember py-2.5 text-center text-xs font-black text-white">3 / 4 přítomno</div>
    </div>
  );
}

function XpScreen() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-[11px] font-black uppercase tracking-wider text-white/50">Můj progres</p>
      <div className="flex items-center gap-3">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 10 }}
          className="grid h-12 w-12 place-items-center rounded-full bg-gradient-ember text-lg"
        >
          🦝
        </motion.span>
        <div>
          <p className="text-sm font-black text-white">Level 4</p>
          <p className="text-[11px] font-bold text-white/55">maskot Ras</p>
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          initial={{ width: '12%' }}
          animate={{ width: '72%' }}
          transition={{ delay: 0.3, duration: 1.1, ease }}
          className="h-full rounded-full bg-gradient-ember"
        />
      </div>
      <p className="text-right text-[10px] font-black text-white/55">2 880 / 4 000 XP</p>
      <div className="grid grid-cols-3 gap-2">
        {['🎁', '🏟️', '🗺️'].map((emoji, index) => (
          <motion.div
            key={emoji}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 + index * 0.12, duration: 0.4, ease }}
            className="grid place-items-center rounded-[14px] bg-white/[0.07] py-4 text-xl"
          >
            {emoji}
          </motion.div>
        ))}
      </div>
      <p className="text-center text-[10px] font-bold text-white/45">bedny · arény · questy</p>
    </div>
  );
}

function MapaScreen() {
  return (
    <div className="relative flex h-full flex-col p-4">
      <p className="text-[11px] font-black uppercase tracking-wider text-white/50">Questová mapa</p>
      <p className="text-sm font-black text-white">Společná výprava</p>
      <div className="relative mt-3 flex-1 overflow-hidden rounded-[14px] bg-white/[0.05]">
        <svg viewBox="0 0 200 220" className="h-full w-full" aria-hidden>
          <motion.path
            d="M30 200 C 60 160, 40 130, 90 110 S 160 80, 150 40"
            fill="none"
            stroke="#E8440A"
            strokeWidth="3"
            strokeDasharray="6 7"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.25, duration: 1.4, ease }}
          />
          {[
            { cx: 30, cy: 200, done: true },
            { cx: 90, cy: 110, done: true },
            { cx: 150, cy: 40, done: false },
          ].map((node, index) => (
            <motion.circle
              key={index}
              cx={node.cx}
              cy={node.cy}
              r="10"
              fill={node.done ? '#E8440A' : '#2E2E4A'}
              stroke="#FFB21A"
              strokeWidth={node.done ? 0 : 2}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 + index * 0.3, type: 'spring', damping: 9 }}
            />
          ))}
        </svg>
        <div className="absolute bottom-2 inset-x-2 rounded-[10px] bg-brand-night/80 px-3 py-2 text-center text-[10px] font-black text-white/80 backdrop-blur-sm">
          12 400 XP týmu · všechny kluby společně
        </div>
      </div>
    </div>
  );
}

const screenComponents = {
  dochazka: DochazkaScreen,
  xp: XpScreen,
  mapa: MapaScreen,
} as const;

export function AppShowcase() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((current) => (current + 1) % screens.length), SCREEN_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const ActiveScreen = screenComponents[screens[active].id];

  return (
    <section className="relative overflow-hidden bg-brand-paper py-20 md:py-28">
      {/* Giant background word */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[30%] select-none text-center text-[20vw] font-black leading-none tracking-tighter text-brand-night/[0.03]">
        aplikace
      </div>

      <div className="section-shell relative grid items-center gap-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* Phone mockup — CSS frame with animated screens switching inside */}
        <motion.div
          initial={{ opacity: 0, y: 50, rotate: -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: -2 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease }}
          className="relative mx-auto w-[280px]"
        >
          <div className="relative aspect-[9/19] overflow-hidden rounded-[44px] border-[10px] border-brand-night bg-brand-night shadow-[0_50px_110px_rgba(26,26,46,0.4)]">
            {/* notch */}
            <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-brand-night" />
            <div className="absolute inset-0 bg-gradient-night">
              <AnimatePresence mode="wait">
                <motion.div
                  key={screens[active].id}
                  initial={{ opacity: 0, x: 36 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -36 }}
                  transition={{ duration: 0.45, ease }}
                  className="absolute inset-0 pt-9"
                >
                  <ActiveScreen />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* floating chip badge overlapping the phone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: 'spring', damping: 11 }}
            className="absolute -right-16 top-16 hidden items-center gap-2 rounded-full border border-brand-night/10 bg-white px-4 py-2 shadow-[0_16px_38px_rgba(26,26,46,0.15)] sm:flex"
          >
            <Smartphone size={14} className="text-brand-ember" />
            <span className="text-[11px] font-black text-brand-night">Expo · iOS i Android</span>
          </motion.div>
        </motion.div>

        {/* Copy + screen selector */}
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
            Aplikace pro trenéry a účastníky běží na telefonu — docházka, progres a odměny okamžitě
            po ruce. Rodiče a administrace používají webový portál.
          </motion.p>

          <div className="mt-8 space-y-3">
            {screens.map((screen, index) => (
              <button
                key={screen.id}
                type="button"
                onClick={() => setActive(index)}
                className={`flex w-full items-start gap-4 rounded-[18px] border p-4 text-left transition-all duration-300 ${
                  index === active
                    ? 'border-brand-ember/30 bg-white shadow-[0_16px_40px_rgba(232,68,10,0.12)]'
                    : 'border-transparent bg-transparent hover:bg-white/60'
                }`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] transition-colors duration-300 ${index === active ? 'bg-gradient-ember text-white' : 'bg-brand-night/[0.06] text-brand-night/50'}`}>
                  <screen.icon size={18} />
                </span>
                <span>
                  <span className="block text-sm font-black text-brand-night">{screen.label}</span>
                  <span className="mt-0.5 block text-xs font-bold leading-5 text-brand-night/50">{screen.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
