import { CalendarClock, ClipboardCheck, Shirt, Trophy, Users, Utensils } from 'lucide-react';

import { PageHero } from '@/components/page-hero';
import { PublicCampCatalog } from '@/components/public-admin-products';
import { SubpageCta } from '@/components/subpage-cta';
import { FeatureCard, SectionIntro } from '@/components/subpage-feature-card';
import { campSchedule } from '@shared/content';

export const metadata = {
  title: 'Tábory',
  description: 'Příměstské parkour tábory TeamVYS s trenéry, programem, jídlem a digitálními dokumenty pro rodiče.',
};

const includes = [
  { icon: <Utensils size={20} />, title: 'Jídlo a pitný režim', body: 'Obědy a svačiny po celý den, zdravá strava i pitný režim.' },
  { icon: <Shirt size={20} />, title: 'Táborové tričko', body: 'Designové tričko z nové letní kolekce TeamVYS.' },
  { icon: <Users size={20} />, title: 'Trenéři a animátoři', body: 'Certifikovaní trenéři a animátoři, kteří děti opravdu baví.' },
  { icon: <Trophy size={20} />, title: 'Trénink, hry a výzvy', body: 'Bohatý program: trénink, hry, překážková dráha i kreativní výzvy.' },
];

export default function CampsPage() {
  return (
    <>
      <PageHero
        eyebrow="Příměstské tábory"
        title="Týden pohybu, her a parkour výzev"
        body="Bezpečný trénink, noví kamarádi a jasný režim dne. Platba i dokumenty vyřešíte online předem."
      />

      {/* Co je v ceně */}
      <section className="section-shell py-16 md:py-20">
        <SectionIntro eyebrow="Co je v ceně" title="Vše bez skrytých příplatků" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {includes.map((item, i) => (
            <FeatureCard key={item.title} icon={item.icon} title={item.title} body={item.body} index={i} />
          ))}
        </div>
      </section>

      {/* Typický den */}
      <section className="section-shell pb-16 md:pb-20">
        <SectionIntro eyebrow="Harmonogram" title="Typický den na táboře" />
        <ol className="mt-8 grid gap-3">
          {campSchedule.map((slot) => (
            <li
              key={slot.time}
              className="flex flex-col gap-1 rounded-2xl border border-black/[0.08] bg-white p-5 sm:flex-row sm:items-center sm:gap-6"
            >
              <span className="inline-flex w-max items-center gap-2 text-sm font-bold text-brand-purple sm:w-[160px]">
                <CalendarClock size={16} />
                {slot.time}
              </span>
              <div>
                <p className="text-base font-black text-brand-ink">{slot.title}</p>
                <p className="mt-0.5 text-sm leading-6 text-neutral-500">{slot.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-black/[0.08] bg-brand-purple/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
              <ClipboardCheck size={18} />
            </span>
            <div>
              <p className="text-sm font-black text-brand-ink">Bez ranního papírování</p>
              <p className="mt-0.5 text-sm leading-6 text-neutral-500">Přihláška, souhlasy i anamnéza jsou připravené v systému pro trenéra.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Katalog turnusů */}
      <section className="section-shell pb-16 md:pb-20">
        <SectionIntro eyebrow="Nabídka" title="Vyber si turnus" />
        <div className="mt-8">
          <PublicCampCatalog />
        </div>
      </section>

      <SubpageCta
        eyebrow="Léto 2026"
        title="Rezervuj místo na táboře"
        highlight="včas."
        body="Kapacita turnusů je omezená. Platba i dokumenty se řeší online, první den stačí přijít a nahlásit jméno."
        ctaHref="/aplikace"
        ctaLabel="Stáhnout aplikaci"
        secondaryHref="/kontakty"
        secondaryLabel="Mám dotaz"
      />
    </>
  );
}
