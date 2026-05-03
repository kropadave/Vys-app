import { FaqSection } from '@/components/sections/faq';
import { FinalCta } from '@/components/sections/final-cta';
import { GallerySection } from '@/components/sections/gallery';
import { Hero } from '@/components/sections/hero';
import { JourneySection } from '@/components/sections/journey';
import { PillarsSection } from '@/components/sections/pillars';
import { ProgramsSection } from '@/components/sections/programs';
import { StatsSection } from '@/components/sections/stats';
import { TestimonialsSection } from '@/components/sections/testimonials';
import { TrustMarquee } from '@/components/sections/trust-marquee';

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustMarquee />
      <StatsSection />
      <ProgramsSection />
      <JourneySection />
      <GallerySection />
      <PillarsSection />
      <TestimonialsSection />
      <FaqSection />
      <FinalCta />
    </>
  );
}
