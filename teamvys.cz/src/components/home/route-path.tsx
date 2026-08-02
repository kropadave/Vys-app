'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Homepage signature effect: a hand-drawn route connecting the three roles
 * (dítě → rodič → trenér), echoing the skill-tree path from the app itself.
 * Draws itself once the row scrolls into view; renders fully drawn up front
 * when the visitor prefers reduced motion.
 */
export function RoutePath() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <svg
      aria-hidden
      viewBox="0 0 720 48"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-2 top-[34px] hidden h-[48px] w-[calc(100%-16px)] md:block"
    >
      {/* Even, deliberate route connecting the three role cards — a shallow,
          single arc that passes exactly through each waypoint, styled like a
          dotted route on a map / the app's own skill-tree path. */}
      <path
        d="M120 32 C 200 32, 280 16, 360 16 S 520 32, 600 32"
        fill="none"
        stroke="#8B1DFF"
        strokeOpacity={0.55}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="1 11"
      />
      <motion.path
        d="M120 32 C 200 32, 280 16, 360 16 S 520 32, 600 32"
        fill="none"
        stroke="#8B1DFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="1 11"
        initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
        whileInView={prefersReducedMotion ? undefined : { pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      {[120, 360, 600].map((cx, index) => (
        <motion.circle
          key={cx}
          cx={cx}
          cy={index === 1 ? 16 : 32}
          r={6}
          fill="#0B0B10"
          stroke="#8B1DFF"
          strokeWidth={2.5}
          initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
          whileInView={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.35, delay: 0.3 + index * 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        />
      ))}
    </svg>
  );
}
