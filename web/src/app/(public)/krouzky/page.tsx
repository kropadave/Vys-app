import { ScanLine, ShieldCheck, Trophy } from 'lucide-react';

import { Reveal } from '@/components/animated/reveal';
import { PageHero } from '@/components/page-hero';
import { PublicCourseCatalog } from '@/components/public-admin-products';

export const metadata = {
  title: 'Kroužky',
  description: 'Pravidelné parkour kroužky v 6 městech. Permanentky 10 nebo 15 vstupů s NFC docházkou.',
};

export default function CoursesPage() {
  return (
    <>
      <PageHero
        eyebrow="Pravidelné kroužky"
        title="Najdi parkour kroužek u tebe ve městě"
        body="Trénujeme v 6 městech, na ověřených sportovištích, s certifikovanými trenéry. Permanentka 10 nebo 15 vstupů s NFC docházkou bez papírování."
        mascotSrc="/vys-maskot-no-logo2.png"
        mascotPosition="top-right"
        mascotScale="oversized"
      />

      <section className="section-shell relative grid gap-3 py-12 md:grid-cols-3">
        <Benefit icon={<ScanLine size={20} />} pillar="10 nebo 15 vstupů" title="Permanentka, ne závazek" body="Vstupy se odečítají postupně přes NFC čip." />
        <Benefit icon={<ShieldCheck size={20} />} pillar="Bezpečný postup" title="Trénink od základů" body="Dopady, koordinace a triky se skládají krok za krokem." />
        <Benefit icon={<Trophy size={20} />} pillar="Skill tree" title="Pokrok je vidět" body="Dítě sbírá XP, odemyká triky a postupuje náramky." />
      </section>

      <PublicCourseCatalog />
    </>
  );
}

function Benefit({ icon, pillar, title, body }: { icon: React.ReactNode; pillar: string; title: string; body: string }) {
  return (
    <Reveal>
      <div className="h-full rounded-[28px] border border-brand-purple/12 bg-white p-5 shadow-brand-soft">
        <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-brand text-white">{icon}</span>
        <p className="mt-5 text-xs font-black uppercase text-brand-cyan">{pillar}</p>
        <h3 className="mt-2 text-lg font-black text-brand-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      </div>
    </Reveal>
  );
}
