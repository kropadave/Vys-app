import { AppDifferentiator } from '@/components/home/differentiator';
import { HomeHero } from '@/components/home/hero';

export const metadata = {
  title: 'TeamVYS — parkour kroužky, tábory a workshopy',
  description:
    'Parkour klub TeamVYS: pravidelné kroužky, příměstské tábory a workshopy v šesti městech, propojené appkou pro děti, rodiče i trenéry.',
};

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <AppDifferentiator />
    </>
  );
}
