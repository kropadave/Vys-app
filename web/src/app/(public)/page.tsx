import { AppShowcase } from '@/components/sections/saas/app-showcase';
import { AudienceSection } from '@/components/sections/saas/audience-section';
import { GamificationSection } from '@/components/sections/saas/gamification-section';
import { PlatformSection } from '@/components/sections/saas/platform-section';
import { PoweredByVys } from '@/components/sections/saas/powered-by-vys';
import { PricingSection } from '@/components/sections/saas/pricing-section';
import { SaasCta } from '@/components/sections/saas/saas-cta';
import { SaasHero } from '@/components/sections/saas/saas-hero';

export const metadata = {
  title: 'TeamVYS — digitální platforma pro dětské sportovní organizace',
  description:
    'Docházka, skupiny, trenéři, platby a gamifikace pro dětské sportovní kluby, bojová umění, taneční školy i gymnastiku. 790 Kč měsíčně, prvních 30 dní zdarma.',
};

export default function HomePage() {
  return (
    <>
      <SaasHero />
      <AudienceSection />
      <PlatformSection />
      <AppShowcase />
      <GamificationSection />
      <PricingSection />
      <PoweredByVys />
      <SaasCta />
    </>
  );
}
