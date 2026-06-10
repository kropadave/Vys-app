'use client';

import { CreditCard, ScanLine, Search, Trophy } from 'lucide-react';

import { Reveal } from '@/components/animated/reveal';

const journey = [
  { step: '01', title: 'Najdi město', body: 'Vyber lokalitu, den a čas podle rozvrhu rodiny.', icon: Search },
  { step: '02', title: 'Zaplať online', body: 'Stripe Checkout vytvoří objednávku pro konkrétní dítě.', icon: CreditCard },
  { step: '03', title: 'Přijď na trénink', body: 'NFC čip zrychlí docházku a rodič vidí účast.', icon: ScanLine },
  { step: '04', title: 'Odemkni progres', body: 'Triky, XP a náramky drží motivaci i bezpečný postup.', icon: Trophy },
];

export function JourneySection() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#080412' }}>
      <div aria-hidden className="absolute inset-x-0 top-0 z-20 h-[2px] bg-white" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 z-20 h-[2px] bg-white" />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-10%] top-[20%] h-[50vh] w-[50vh] rounded-full bg-[radial-gradient(circle,rgba(241,43,179,0.14)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-[10%] h-[40vh] w-[60vh] rounded-full bg-[radial-gradient(circle,rgba(139,29,255,0.2)_0%,transparent_70%)]" />
      </div>
      <div aria-hidden className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,black,transparent)]" />

      <div className="section-shell relative py-24 md:py-32">
        <Reveal>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-pink">Jak to běží</p>
          <h2 className="mt-4 max-w-[18ch] text-[clamp(2.4rem,5vw,4.5rem)] font-black leading-[0.94] tracking-[-0.03em] text-white">
            Od výběru k prvnímu odemčenému triku.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden rounded-[32px] border border-white/10 bg-white/10 sm:grid-cols-2 md:grid-cols-4">
          {journey.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.step} delay={i * 80}>
                <div className="group flex h-full min-h-[250px] flex-col bg-white/[0.04] p-8 backdrop-blur-sm transition-colors duration-500 hover:bg-white/[0.08]">
                  <span className="text-[11px] font-black tracking-[0.2em] text-white/35">{step.step}</span>

                  <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-brand text-white shadow-lg">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-6 text-xl font-black text-white">{step.title}</h3>

                  <p className="mt-2 flex-1 text-[15px] leading-6 text-white/50 transition-all duration-500 ease-out md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                    {step.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
