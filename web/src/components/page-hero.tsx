import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/animated/reveal';
import { VysMaskotImage } from '@/components/brand/vys-maskot';
import { cn } from '@/lib/utils';

type MascotPosition = 'top-right' | 'middle-right' | 'bottom-right' | 'edge-right';
type MascotScale = 'default' | 'oversized';

type Props = {
  eyebrow: string;
  title: string;
  body?: string;
  mascot?: boolean;
  mascotSrc?: string;
  mascotPosition?: MascotPosition;
  mascotScale?: MascotScale;
  mascotWidthClass?: string;
  mascotDesktopPositionClass?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

const mascotPositionClass: Record<MascotPosition, string> = {
  'top-right': 'right-8 top-0 rotate-3',
  'middle-right': 'right-3 top-1/2 -translate-y-1/2 -rotate-2',
  'bottom-right': 'bottom-[-20px] right-10 rotate-6',
  'edge-right': '-right-5 top-8 -rotate-6',
};
const mobileMascotPositionClass: Record<MascotPosition, string> = {
  'top-right': '-right-3 top-2 rotate-3',
  'middle-right': '-right-3 top-2 -rotate-2',
  'bottom-right': '-right-3 top-2 rotate-3',
  'edge-right': '-right-4 top-2 -rotate-3',
};
const oversizedMascotPositionClass: Record<MascotPosition, string> = {
  'top-right': '-right-10 -top-44 rotate-2',
  'middle-right': '-right-10 -top-44 -rotate-2',
  'bottom-right': '-right-10 -top-44 rotate-3',
  'edge-right': '-right-16 -top-56 -rotate-3 lg:-top-64',
};
const oversizedMobileMascotPositionClass: Record<MascotPosition, string> = {
  'top-right': 'rotate-2',
  'middle-right': '-rotate-2',
  'bottom-right': 'rotate-3',
  'edge-right': '-rotate-3',
};
const mascotSizeClass: Record<MascotPosition, string> = {
  'top-right': 'w-[168px] lg:w-[190px]',
  'middle-right': 'w-[168px] lg:w-[190px]',
  'bottom-right': 'w-[168px] lg:w-[190px]',
  'edge-right': 'w-[280px] lg:w-[320px]',
};
const mobileMascotSizeClass: Record<MascotPosition, string> = {
  'top-right': 'w-[74px]',
  'middle-right': 'w-[74px]',
  'bottom-right': 'w-[74px]',
  'edge-right': 'w-[108px]',
};
// Velikosti pro oversized variantu — `edge-right` (workshopy) je o něco větší, protože jeho asset má kolem postavy víc volného prostoru a opticky působí menší.
const oversizedMascotSizeClassByPosition: Record<MascotPosition, string> = {
  'top-right': 'w-[300px] lg:w-[350px] xl:w-[390px]',
  'middle-right': 'w-[300px] lg:w-[350px] xl:w-[390px]',
  'bottom-right': 'w-[300px] lg:w-[350px] xl:w-[390px]',
  'edge-right': 'w-[360px] lg:w-[420px] xl:w-[470px]',
};
const oversizedMobileMascotSizeClassByPosition: Record<MascotPosition, string> = {
  'top-right': 'w-[170px] sm:w-[220px] md:w-[300px]',
  'middle-right': 'w-[170px] sm:w-[220px] md:w-[300px]',
  'bottom-right': 'w-[170px] sm:w-[220px] md:w-[300px]',
  'edge-right': 'w-[220px] sm:w-[280px] md:w-[360px]',
};

export function PageHero({ eyebrow, title, body, mascot = true, mascotSrc = '/vys-maskot-no-logo.png', mascotPosition = 'middle-right', mascotScale = 'default', mascotWidthClass, mascotDesktopPositionClass, ctaHref, ctaLabel }: Props) {
  const isOversizedMascot = mascotScale === 'oversized';
  const mobileSizeClass = isOversizedMascot ? oversizedMobileMascotSizeClassByPosition[mascotPosition] : mobileMascotSizeClass[mascotPosition];
  const mobilePositionClass = isOversizedMascot ? oversizedMobileMascotPositionClass[mascotPosition] : mobileMascotPositionClass[mascotPosition];
  const desktopSizeClass = mascotWidthClass ?? (isOversizedMascot ? oversizedMascotSizeClassByPosition[mascotPosition] : mascotSizeClass[mascotPosition]);
  const desktopPositionClass = mascotDesktopPositionClass ?? (isOversizedMascot ? oversizedMascotPositionClass[mascotPosition] : mascotPositionClass[mascotPosition]);
  const oversizedMascotSizes = mascotPosition === 'edge-right'
    ? '(max-width: 640px) 220px, (max-width: 1024px) 360px, (max-width: 1280px) 590px, 660px'
    : '(max-width: 640px) 170px, (max-width: 1024px) 300px, (max-width: 1280px) 410px, 470px';
  const mascotSizes = isOversizedMascot ? oversizedMascotSizes : mascotPosition === 'edge-right' ? '360px' : '220px';
  const shellClass = cn(
    'section-shell relative overflow-hidden rounded-[30px] border border-brand-purple/12 bg-white text-brand-ink shadow-brand-float md:overflow-visible',
    isOversizedMascot ? 'mt-6 mb-14 md:mt-16 md:mb-20 lg:mt-24 lg:mb-24 xl:mb-28' : 'mt-6'
  );
  const gridClass = cn(
    'relative grid gap-5 p-6 sm:p-7 md:p-10',
    isOversizedMascot ? 'lg:min-h-[330px] lg:grid-cols-[minmax(0,1fr)_380px] xl:min-h-[350px] xl:grid-cols-[minmax(0,1fr)_440px]' : 'md:grid-cols-[1fr_280px]'
  );
  const contentClass = 'max-w-[780px]';
  const mascotColumnClass = cn('relative hidden', isOversizedMascot ? 'lg:block lg:min-h-[300px] xl:min-h-[320px]' : 'md:block min-h-[220px]');
  const headingClass = cn(
    'mt-4 font-black leading-tight text-brand-ink',
    isOversizedMascot ? 'text-[32px] sm:text-[40px] md:text-5xl lg:text-6xl' : 'text-[34px] md:text-6xl'
  );
  const topRowClass = cn(
    'relative',
    isOversizedMascot ? 'flex flex-col items-start gap-3 lg:min-h-0' : 'flex items-start justify-between gap-3'
  );
  const eyebrowClass = cn(
    'inline-flex w-max items-center rounded-brand bg-brand-purple-light px-3 py-2 text-xs font-black uppercase text-brand-purple-deep',
    isOversizedMascot ? 'relative z-20 max-w-full whitespace-normal leading-none' : undefined
  );

  return (
    <section className={shellClass}>
      <div aria-hidden className="absolute inset-x-0 top-0 z-10 h-10 overflow-hidden rounded-t-[30px]">
        <div className="h-1.5 bg-gradient-brand" />
      </div>
      <div aria-hidden className="absolute inset-0 diagonal-rails opacity-[0.04]" />

      <div className={gridClass}>
        <div className={contentClass}>
          <div className={topRowClass}>
            <Reveal>
              <span className={eyebrowClass}>
                {eyebrow}
              </span>
            </Reveal>
            {/* Tablet mascot — only visible between md and lg for oversized variants */}
            {mascot && isOversizedMascot ? (
              <div className={cn('pointer-events-none z-20 shrink-0 drop-shadow-[0_16px_20px_rgba(83,36,140,0.22)] hidden md:block lg:hidden', 'relative', mobileSizeClass, mobilePositionClass)}>
                <VysMaskotImage src={mascotSrc} priority sizes={mascotSizes} />
              </div>
            ) : null}
          </div>
          <Reveal delay={120}>
            <h1 className={headingClass}>{title}</h1>
          </Reveal>
          {body ? (
            <Reveal delay={210}>
              <p className="mt-3 max-w-[680px] text-sm leading-6 text-brand-ink-soft md:mt-4 md:text-lg md:leading-7">{body}</p>
            </Reveal>
          ) : null}
          {ctaHref && ctaLabel ? (
            <Reveal delay={300}>
              <Link href={ctaHref} className="mt-6 inline-flex items-center gap-2 rounded-brand bg-gradient-brand px-5 py-3 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5">
                {ctaLabel}
                <ArrowRight size={17} />
              </Link>
            </Reveal>
          ) : null}
        </div>
        {mascot ? (
          <div className={mascotColumnClass}>
            <div className={cn('pointer-events-none absolute z-20 z-20 drop-shadow-[0_24px_30px_rgba(83,36,140,0.24)]', desktopSizeClass, desktopPositionClass)}>
              <VysMaskotImage src={mascotSrc} priority sizes={mascotSizes} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
