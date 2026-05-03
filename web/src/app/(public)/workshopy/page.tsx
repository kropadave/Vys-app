import { ArrowRight, CheckCircle2, QrCode, Sparkles, Target } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/animated/reveal';
import { PageHero } from '@/components/page-hero';
import { AdminCreatedWorkshopCards } from '@/components/public-admin-products';
import { workshops } from '@shared/content';

export const metadata = {
  title: 'Workshopy',
  description: 'Jednorázové parkour workshopy TeamVYS pro konkrétní triky, flow a bezpečný progres.',
};

const workshopSteps = [
  { title: 'Konkrétní triky', body: 'Každý workshop má jasné téma a triky, které děti trénují krok za krokem.', icon: Target },
  { title: 'QR ticket', body: 'Po zaplacení se rodiči zobrazí digitální ticket pro rychlou kontrolu na místě.', icon: QrCode },
  { title: 'Navazuje na skill tree', body: 'Trenér ví, které prvky může dítě dostat do profilu a co má trénovat dál.', icon: Sparkles },
];

export default function WorkshopsPage() {
  return (
    <>
      <PageHero
        eyebrow="Workshopy a open jamy"
        title="Jednorázové akce pro rychlý progres"
        body="Když dítě chce potrénovat konkrétní přeskok, flow nebo tricking kombinaci, workshop je ideální. Kratší, intenzivní a s jasným výsledkem."
        image="/courses/brandys_BR4.webp"
        mascotSrc="/vys-maskot-no-logo4.png"
        mascotPosition="bottom-right"
        mascotScale="oversized"
        mascotWidthClass="w-[520px] lg:w-[590px] xl:w-[660px]"
        mascotDesktopPositionClass="-right-10 -top-64 rotate-3 lg:-top-72"
      />

      <section className="section-shell grid gap-3 py-10 md:grid-cols-3">
        {workshopSteps.map((step, index) => (
          <Reveal key={step.title} delay={index * 70}>
            <div className="h-full rounded-brand border border-brand-purple/12 bg-white p-6 shadow-brand-soft">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-brand bg-gradient-brand text-white">
                <step.icon size={20} />
              </span>
              <p className="mt-5 text-xs font-black uppercase text-brand-cyan">0{index + 1}</p>
              <h2 className="mt-2 text-lg font-black text-brand-ink">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="section-shell py-10">
        <Reveal>
          <div className="max-w-[760px]">
            <p className="text-xs font-black uppercase text-brand-orange">Nejbližší akce</p>
            <h2 className="mt-2 text-2xl font-black text-brand-ink md:text-4xl">Workshop s digitálním ticketem</h2>
          </div>
        </Reveal>

        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          {workshops.map((workshop, index) => (
            <Reveal key={workshop.id} delay={index * 80}>
              <article className="h-full overflow-hidden rounded-brand border border-brand-purple/12 bg-white shadow-brand">
                <div className="p-6 md:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="inline-block rounded-brand bg-brand-cyan/12 px-3 py-2 text-xs font-black uppercase text-brand-cyan">
                        {workshop.city}
                      </span>
                      <h3 className="mt-3 text-2xl font-black text-brand-ink md:text-3xl">{workshop.place}</h3>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-xs font-black uppercase text-slate-400">Cena</p>
                      <p className="mt-1 text-2xl font-black text-brand-ink">{workshop.price}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Info label="Termín" value={workshop.date} />
                    <Info label="Kapacita" value={`${workshop.capacityCurrent}/${workshop.capacityTotal} míst`} />
                  </div>
                  <CapacityMeter current={workshop.capacityCurrent} total={workshop.capacityTotal} />
                  <p className="mt-5 text-sm leading-6 text-slate-600">{workshop.body}</p>
                  <p className="mt-4 inline-flex gap-2 text-sm font-bold text-brand-ink"><CheckCircle2 size={18} className="text-brand-cyan" /> QR ticket po zaplacení</p>
                  <Link
                    href={`/sign-in?next=/checkout/${workshop.id}`}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-brand bg-gradient-brand px-6 py-4 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5"
                  >
                    Koupit ticket
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
          <AdminCreatedWorkshopCards startDelay={workshops.length * 80} />
        </div>
      </section>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-brand bg-brand-paper p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-brand-ink">{value}</p>
    </div>
  );
}