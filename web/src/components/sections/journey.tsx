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
    <section className="section-shell py-16">
      <div className="rounded-brand border border-brand-purple/12 bg-white p-6 text-brand-ink shadow-brand-float md:p-9">
        <Reveal>
          <div className="max-w-[760px]">
            <p className="text-xs font-black uppercase text-brand-pink">Jak to běží</p>
            <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">
              Od výběru k prvnímu odemčenému triku.
            </h2>
          </div>
        </Reveal>

        <div className="mt-9 grid gap-3 md:grid-cols-4">
          {journey.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.step} delay={index * 90}>
                <div className="h-full border-l border-brand-purple/16 pl-5">
                  <span className="text-sm font-black text-brand-pink">{step.step}</span>
                  <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-brand bg-gradient-brand text-white">
                    <Icon size={21} />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-brand-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-ink-soft">{step.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
