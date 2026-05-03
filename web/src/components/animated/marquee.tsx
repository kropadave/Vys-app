'use client';

import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  speed?: number; // seconds per loop
  className?: string;
  reverse?: boolean;
};

/**
 * Pure-CSS infinite horizontal marquee. Renders children twice for seamless loop.
 * The animation is defined as `marquee` keyframe in tailwind.config.
 */
export function Marquee({ children, speed = 32, className, reverse = false }: Props) {
  return (
    <div className={cn('overflow-hidden marquee-mask', className)}>
      <div
        className="flex w-max gap-8"
        style={{
          animation: `marquee ${speed}s linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        <div className="flex gap-8 shrink-0">{children}</div>
        <div className="flex gap-8 shrink-0" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
