import { ScanLine, ShieldCheck, Trophy } from 'lucide-react';

import { PageHero } from '@/components/page-hero';
import { PublicCourseCatalog } from '@/components/public-admin-products';
import { SubpageCta } from '@/components/subpage-cta';
import { FeatureCard } from '@/components/subpage-feature-card';

export const metadata = {
  title: 'Kroužky',
  description: 'Pravidelné parkour kroužky v 6 městech. Permanentky 10 nebo 15 vstupů s NFC docházkou.',
};

const benefits = [
  { icon: <ScanLine size={20} />, eyebrow: '10 / 15 vstupů', title: 'Permanentka, ne závazek', body: 'Vstupy se odečítají postupně přes NFC čip.', accent: 'purple' as const },
  { icon: <ShieldCheck size={20} />, eyebrow: 'Bezpečně', title: 'Trénink od základů', body: 'Dopady, koordinace a triky krok za krokem.', accent: 'pink' as const },
  { icon: <Trophy size={20} />, eyebrow: 'Skill tree', title: 'Pokrok je vidět', body: 'Dítě sbírá XP, odemyká triky a postupuje náramky.', accent: 'cyan' as const },
];

export default function CoursesPage() {
  return (
    <>
      <PageHero
        eyebrow="Pravidelné kroužky"
        title="Parkour kroužek u tebe ve městě"
        body="6 měst. Certifikovaní trenéři. Permanentka s NFC docházkou."
        word="kroužky"
      />

      <section className="section-shell relative grid gap-4 py-14 md:grid-cols-3">
        {benefits.map((b, i) => (
          <FeatureCard key={b.title} {...b} index={i} />
        ))}
      </section>

      <PublicCourseCatalog />

      <SubpageCta
        eyebrow="Přidej se"
        title="Místa v kroužcích mizí rychle."
        highlight="Rezervuj včas."
        body="Vyber město, kup permanentku online a dítě může dorazit už na další trénink."
        ctaHref="/sign-in"
        ctaLabel="Přihlásit dítě"
        secondaryHref="/kontakty"
        secondaryLabel="Mám dotaz"
      />
    </>
  );
}
