import { ArrowRight, CalendarDays, CheckCircle2, Clock, Shirt, Utensils } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/animated/reveal';
import { CreatedProductsSection } from '@/components/created-products-section';
import { PageHero } from '@/components/page-hero';
import { campIncludes, camps, campSchedule } from '@shared/content';

export const metadata = {
  title: 'Tábory',
  description: 'Příměstské parkour tábory TeamVYS s trenéry, programem, jídlem a digitálními dokumenty pro rodiče.',
};

export default function CampsPage() {
  return (
    <>
      <PageHero
        eyebrow="Příměstské tábory"
        title="Týden pohybu, her a parkour výzev"
        body="Letní tábory stavíme tak, aby si děti užily bezpečný trénink, nové kamarády a jasný režim dne. Rodič po přihlášení vyřeší platbu, dokumenty i QR ticket na jednom místě."
        image="/courses/nadrazka_ZS-Nadrazka-Foto3.webp"
        mascotSrc="/vys-maskot-no-logo3.png"
        mascotPosition="bottom-right"
        mascotScale="oversized"
      />

      <section className="section-shell grid gap-4 py-10 lg:grid-cols-[1fr_0.82fr]">
        <Reveal>
          <div className="rounded-brand border border-brand-purple/12 bg-white p-6 shadow-brand-soft md:p-8">
            <p className="text-xs font-black uppercase text-brand-orange">Co je v ceně</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {campIncludes.map((item, index) => (
                <div key={item} className="flex gap-3 rounded-brand bg-brand-paper p-4">
                  <span className="mt-1 text-brand-cyan">{index === 0 ? <Utensils size={18} /> : index === 1 ? <Shirt size={18} /> : <CheckCircle2 size={18} />}</span>
                  <p className="text-sm font-bold leading-6 text-brand-ink">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="h-full rounded-brand border border-brand-purple/12 bg-white p-6 text-brand-ink shadow-brand md:p-8">
            <p className="text-xs font-black uppercase text-brand-pink">Typický den</p>
            <div className="mt-5 space-y-4">
              {campSchedule.map((slot) => (
                <div key={slot.time} className="grid grid-cols-[102px_1fr] gap-3 border-l border-brand-purple/14 pl-3">
                  <span className="flex items-start gap-1 pt-1 text-xs font-black text-brand-cyan"><Clock size={14} />{slot.time}</span>
                  <div>
                    <h3 className="text-sm font-black">{slot.title}</h3>
                    <p className="text-sm leading-6 text-brand-ink-soft">{slot.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="section-shell py-10">
        <Reveal>
          <div className="max-w-[760px]">
            <p className="text-xs font-black uppercase text-brand-cyan">Aktuální turnusy</p>
            <h2 className="mt-2 text-2xl font-black text-brand-ink md:text-4xl">Vyber místo a rezervuj dítěti místo</h2>
          </div>
        </Reveal>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {camps.map((camp, index) => (
            <Reveal key={camp.id} delay={index * 80}>
              <article className="h-full overflow-hidden rounded-brand border border-brand-purple/12 bg-white shadow-brand">
                <div className="relative min-h-[190px] bg-gradient-brand p-6 text-white">
                  <div aria-hidden className="absolute inset-0 diagonal-rails opacity-12" />
                  <span className="relative inline-flex w-max items-center gap-2 rounded-brand bg-white px-3 py-2 text-xs font-black uppercase text-brand-ink">
                    <CalendarDays size={15} />
                    {camp.season}
                  </span>
                  <div className="relative pt-12">
                    <h3 className="text-3xl font-black text-white">{camp.venue}</h3>
                    <p className="mt-1 font-bold text-white/78">{camp.place}</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400">Cena</p>
                      <p className="mt-1 text-2xl font-black text-brand-ink">{camp.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase text-slate-400">Kapacita</p>
                      <p className="mt-1 text-lg font-black text-brand-ink">{camp.capacityCurrent}/{camp.capacityTotal} dětí</p>
                    </div>
                  </div>
                  <CapacityMeter current={camp.capacityCurrent} total={camp.capacityTotal} />
                  <ul className="mt-5 space-y-2.5">
                    {camp.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-2 text-sm leading-6 text-slate-600">
                        <CheckCircle2 size={17} className="mt-1 shrink-0 text-brand-cyan" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/sign-in?next=/checkout/${camp.id}`}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-brand bg-gradient-brand px-6 py-4 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5"
                  >
                    Rezervovat a zaplatit
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <CreatedProductsSection type="Tabor" />
    </>
  );
}

function CapacityMeter({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const remaining = Math.max(0, total - current);

  return (
    <div className="mt-4 rounded-brand bg-brand-paper p-3">
      <div className="flex items-center justify-between gap-3 text-xs font-black">
        <span className="text-brand-ink">Aktuálně {current}/{total}</span>
        <span className="text-brand-cyan">{remaining} volných míst</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-cyan" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}