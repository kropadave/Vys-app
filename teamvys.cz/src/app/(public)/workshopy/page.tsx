import { QrCode, Sparkles, Target } from 'lucide-react';

import { PageHero } from '@/components/page-hero';
import { WorkshopBrowser } from '@/components/public-admin-products';
import { SubpageCta } from '@/components/subpage-cta';
import { FeatureCard, SectionIntro } from '@/components/subpage-feature-card';

export const metadata = {
  title: 'Workshopy',
  description: 'Jednorázové parkour workshopy TeamVYS pro konkrétní triky, flow a bezpečný progres.',
};

const workshopSteps = [
  { icon: <Target size={20} />, eyebrow: '01', title: 'Konkrétní triky', body: 'Každý workshop má jasné téma a triky krok za krokem.', accent: 'purple' as const },
  { icon: <QrCode size={20} />, eyebrow: '02', title: 'QR ticket', body: 'Po zaplacení se rodiči zobrazí digitální ticket pro kontrolu na místě.', accent: 'pink' as const },
  { icon: <Sparkles size={20} />, eyebrow: '03', title: 'Navazuje na skill tree', body: 'Trenér ví, které prvky může dítě dostat do profilu.', accent: 'cyan' as const },
];

export default function WorkshopsPage() {
  return (
    <>
      <PageHero
        eyebrow="Workshopy a open jamy"
        title="Jednorázové akce pro rychlý progres"
        body="Kratší, intenzivní a s jasným výsledkem."
        word="workshopy"
      />

      <section className="section-shell py-16 md:py-20">
        <SectionIntro eyebrow="Jak to funguje" title="Jednorázově, ale s výsledkem" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {workshopSteps.map((s, i) => (
            <FeatureCard key={s.title} {...s} index={i} />
          ))}
        </div>
      </section>

      <section className="section-shell pb-16 md:pb-20">
        <SectionIntro eyebrow="Nejbližší akce" title="Workshopy s digitálním ticketem" />
        <div className="mt-8">
          <WorkshopBrowser />
        </div>
      </section>

      <SubpageCta
        eyebrow="Jednorázové akce"
        title="Jeden workshop, viditelný posun."
        highlight="Vyzkoušej to."
        body="Platí se online, ticket máš hned v telefonu. Kapacita bývá omezená."
        ctaHref="/aplikace"
        ctaLabel="Stáhnout aplikaci"
        secondaryHref="/krouzky"
        secondaryLabel="Spíš pravidelný kroužek"
      />
    </>
  );
}