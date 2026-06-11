import { Suspense } from 'react';

import { Reveal } from '@/components/animated/reveal';
import { OrgRegistrationForm } from '@/components/org-registration-form';
import { PageHero } from '@/components/page-hero';

export const metadata = {
  title: 'Registrace organizace',
  description: 'Založte svůj sportovní klub na platformě TeamVYS. Prvních 30 dní zdarma, poté 790 Kč měsíčně.',
};

const BENEFITS = [
  { title: 'Správa kroužků a docházky', body: 'Trenéři odbavují tréninky v mobilní aplikaci, rodiče vidí docházku online.' },
  { title: 'Gamifikace pro děti', body: 'Arény, maskoti, mapa pokroku a žebříčky motivují děti k pravidelné docházce.' },
  { title: 'Platby bez starostí', body: 'Online platby kroužků a akcí přes Stripe, přehledy pro správce klubu.' },
  { title: '30 dní zdarma', body: 'Vyzkoušejte vše bez závazků. Poté 790 Kč měsíčně, zrušit lze kdykoli.' },
];

export default function OrgRegistrationPage() {
  return (
    <>
      <PageHero
        eyebrow="Pro kluby a oddíly"
        title="Vaše organizace na platformě TeamVYS"
        body="Docházka, platby, gamifikace a komunikace s rodiči v jedné aplikaci. Registrace zabere dvě minuty."
      />
      <section className="section-shell grid gap-4 py-10 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <div className="grid gap-3">
            {BENEFITS.map((benefit) => (
              <div key={benefit.title} className="rounded-brand border border-brand-purple/12 bg-white p-5 shadow-brand">
                <h3 className="text-base font-black text-brand-ink">{benefit.title}</h3>
                <p className="mt-1 text-sm text-brand-ink/75">{benefit.body}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <Suspense fallback={null}>
            <OrgRegistrationForm />
          </Suspense>
        </Reveal>
      </section>
    </>
  );
}
