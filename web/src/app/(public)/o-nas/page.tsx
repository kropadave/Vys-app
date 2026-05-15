import { ShieldCheck, Smartphone, Trophy, Users } from 'lucide-react';

import { Reveal } from '@/components/animated/reveal';
import { PageHero } from '@/components/page-hero';
import { aboutPillars, aboutText } from '@shared/content';

export const metadata = {
  title: 'O nás',
  description: 'TeamVYS je parkourová komunita pro děti, teenagery a rodiče se skill tree, NFC docházkou a zkušenými trenéry.',
};

const icons = [ShieldCheck, Trophy, Users, Smartphone];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="O nás" title="TeamVYS je komunita, která učí pohyb s hlavou" body={aboutText} mascot={false} />

      <section className="section-shell py-10">
        <Reveal>
          <div className="max-w-[760px]">
            <p className="text-xs font-black uppercase text-brand-cyan">Jak trénujeme</p>
            <h2 className="mt-2 text-2xl font-black text-brand-ink md:text-4xl">Parkour je pro nás cesta, ne jednorázový výkon</h2>
          </div>
        </Reveal>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {aboutPillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 70}>
              <article className="h-full rounded-brand border border-brand-purple/12 bg-white p-6 shadow-brand-soft">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-brand bg-gradient-brand text-white">
                  {(() => {
                    const Icon = icons[index % icons.length];
                    return <Icon size={20} />;
                  })()}
                </span>
                <h3 className="mt-5 text-xl font-black text-brand-ink">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{pillar.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}