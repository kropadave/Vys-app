import { FaqSection } from '@/components/sections/faq';
import { FinalCta } from '@/components/sections/final-cta';
import { GallerySection } from '@/components/sections/gallery';
import { Hero } from '@/components/sections/hero';
import { JourneySection } from '@/components/sections/journey';
import { PillarsSection } from '@/components/sections/pillars';
import { ProgramsSection } from '@/components/sections/programs';
import { StatsSection } from '@/components/sections/stats';
import { TrustMarquee } from '@/components/sections/trust-marquee';

function SectionDivider() {
  return <div aria-hidden className="h-2 bg-white" />;
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <SectionDivider />
      <TrustMarquee />
      <StatsSection />
      <ProgramsSection />
      <SectionDivider />
      <JourneySection />
      <GallerySection />
      <SectionDivider />
      <PillarsSection />
      <FaqSection />
      <SectionDivider />
      <FinalCta />
    </>
  );
}
