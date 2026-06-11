import { ShieldCheck, Smartphone, Trophy, Users } from 'lucide-react';

import { PageHero } from '@/components/page-hero';
import { SubpageCta } from '@/components/subpage-cta';
import { FeatureCard, SectionIntro } from '@/components/subpage-feature-card';
import { aboutPillars, aboutText } from '@shared/content';

export const metadata = {
  title: 'O nás',
  description: 'TeamVYS je parkourová komunita pro děti, teenagery a rodiče se skill tree, NFC docházkou a zkušenými trenéry.',
};

const icons = [<ShieldCheck key="s" size={20} />, <Trophy key="t" size={20} />, <Users key="u" size={20} />, <Smartphone key="m" size={20} />];
const accents = ['purple', 'pink', 'cyan', 'purple'] as const;

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="O nás" title="Pohyb s hlavou" body={aboutText} word="komunita" />

      <section className="section-shell py-14">
        <SectionIntro eyebrow="Jak trénujeme" title="Parkour je cesta, ne jednorázový výkon" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {aboutPillars.map((pillar, index) => (
            <FeatureCard
              key={pillar.title}
              icon={icons[index % icons.length]}
              title={pillar.title}
              body={pillar.body}
              accent={accents[index % accents.length]}
              index={index}
            />
          ))}
        </div>
      </section>

      <SubpageCta
        eyebrow="Pojď do toho"
        title="Začni s parkourem"
        highlight="bezpečně."
        body="Vyber kroužek ve svém městě nebo se ozvi — rádi poradíme."
        ctaHref="/krouzky"
        ctaLabel="Najít kroužek"
        secondaryHref="/kontakty"
        secondaryLabel="Napsat nám"
      />
    </>
  );
}