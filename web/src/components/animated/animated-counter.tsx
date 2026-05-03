'use client';

import { useInView } from 'framer-motion';
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
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!inView) return;
    const start = Date.now() + delay;
    let raf = 0;
    const tick = () => {
      const now = Date.now();
      if (now < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, from, to, delay, duration]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
