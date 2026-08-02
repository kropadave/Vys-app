'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  to: number;
  from?: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
};

export function AnimatedCounter({ to, from = 0, duration = 1400, delay = 0, prefix = '', suffix = '', decimals = 0, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef(0);
  const hasRunRef = useRef(false);
  const [value, setValue] = useState(from);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (hasRunRef.current) {
      setValue(to);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const animate = () => {
      hasRunRef.current = true;
      if (prefersReducedMotion) {
        setValue(to);
        return;
      }

      const start = performance.now() + delay;
      const tick = (now: number) => {
        if (now < start) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }

        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(from + (to - from) * eased);
        if (progress < 1) rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        animate();
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.18 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [from, to, delay, duration]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export function AnimatedStatValue({ value, delay = 0, className }: { value: string; delay?: number; className?: string }) {
  if (value === '...') return <span className={className}>...</span>;

  const ratioMatch = value.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (ratioMatch) {
    return (
      <span className={className}>
        <AnimatedCounter to={Number(ratioMatch[1])} delay={delay} />
        /
        <AnimatedCounter to={Number(ratioMatch[2])} delay={delay + 120} />
      </span>
    );
  }

  const numberMatch = value.match(/^([^\d-]*)(-?\d+(?:[,.]\d+)?)(.*)$/);
  if (!numberMatch) return <span className={className}>{value}</span>;

  const [, prefix, rawNumber, suffix] = numberMatch;
  const decimals = rawNumber.includes('.') || rawNumber.includes(',') ? rawNumber.split(/[,.]/)[1]?.length ?? 0 : 0;

  return (
    <AnimatedCounter
      to={Number(rawNumber.replace(',', '.'))}
      delay={delay}
      prefix={prefix}
      suffix={suffix}
      decimals={decimals}
      className={className}
    />
  );
}
