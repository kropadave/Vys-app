import { QrCode, Sparkles, Target } from 'lucide-react';

import { Reveal } from '@/components/animated/reveal';
import { PageHero } from '@/components/page-hero';
import { AdminCreatedWorkshopCards } from '@/components/public-admin-products';

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
        mascotSrc="/vys-maskot-no-logo4.png"
        mascotPosition="bottom-right"
        mascotScale="oversized"
        mascotWidthClass="w-[360px] lg:w-[420px] xl:w-[470px]"
        mascotDesktopPositionClass="-right-8 -top-36 rotate-3 lg:-top-44"
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
            <h2 className="mt-2 text-2xl font-black text-brand-ink md:text-4xl">Workshopy s digitálním ticketem</h2>
          </div>
        </Reveal>

        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          <AdminCreatedWorkshopCards />
        </div>
      </section>
    </>
  );
}