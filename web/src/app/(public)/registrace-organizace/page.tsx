import { Suspense } from 'react';
import { CalendarCheck, CreditCard, Gamepad2, Users } from 'lucide-react';

import { Reveal } from '@/components/animated/reveal';
import { OrgRegistrationForm } from '@/components/org-registration-form';
import { PageHero } from '@/components/page-hero';
import { FeatureCard } from '@/components/subpage-feature-card';

export const metadata = {
  title: 'Registrace organizace',
  description: 'Založte svůj sportovní klub na platformě TeamVYS. Prvních 30 dní zdarma, poté 790 Kč měsíčně.',
};

const benefits = [
  { icon: <CalendarCheck size={20} />, title: 'Docházka a kroužky', body: 'Trenéři odbavují tréninky v appce, rodiče vidí docházku online.', accent: 'purple' as const },
  { icon: <Gamepad2 size={20} />, title: 'Gamifikace pro děti', body: 'Arény, maskoti, mapa pokroku a žebříčky motivují k docházce.', accent: 'pink' as const },
  { icon: <CreditCard size={20} />, title: 'Platby bez starostí', body: 'Online platby kroužků a akcí přes Stripe, přehledy pro správce.', accent: 'cyan' as const },
  { icon: <Users size={20} />, title: '30 dní zdarma', body: 'Vyzkoušejte vše bez závazků. Poté 790 Kč měsíčně, zrušit kdykoli.', accent: 'purple' as const },
];

export default function OrgRegistrationPage() {
  return (
    <>
      <PageHero
        eyebrow="Pro kluby a oddíly"
        title="Vaše organizace digitálně"
        body="Docházka, platby a gamifikace v jedné aplikaci. Registrace zabere dvě minuty."
        word="klub"
      />
      <section className="section-shell grid items-start gap-5 py-14 lg:grid-cols-[1fr_1.05fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {benefits.map((b, i) => (
            <FeatureCard key={b.title} {...b} index={i} />
          ))}
        </div>

        <Reveal delay={120}>
          <Suspense fallback={null}>
            <OrgRegistrationForm />
          </Suspense>
        </Reveal>
      </section>
    </>
  );
}
