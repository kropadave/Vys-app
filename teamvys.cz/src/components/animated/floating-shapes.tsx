'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type FloatProps = {
  children: ReactNode;
  amplitude?: number;
  duration?: number;
  className?: string;
};

export function FloatingShape({ children, amplitude = 8, duration = 3.4, className }: FloatProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={cn('inline-block', className)}
      animate={reduced ? {} : { y: [-amplitude, amplitude, -amplitude] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

type SpotlightProps = {
  color: string;
  size?: number;
  opacity?: number;
  className?: string;
};

export function Spotlight({ color, size = 360, opacity = 0.18, className }: SpotlightProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none', className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at center, ${hexToRgba(color, opacity)} 0%, ${hexToRgba(color, 0)} 70%)`,
      }}
    />
  );
}

type BlobProps = {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
};

export function BlobShape({ size = 220, color = '#9B2CFF', opacity = 0.18, className }: BlobProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none rounded-[50%] blur-3xl', className)}
      style={{
        width: size,
        height: size,
        background: hexToRgba(color, opacity),
      }}
    />
  );
}

type SparkleProps = {
  size?: number;
  color?: string;
  className?: string;
};

export function Sparkle({ size = 32, color = '#FFB21A', className }: SparkleProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <path d="M20 2 L23 17 L38 20 L23 23 L20 38 L17 23 L2 20 L17 17 Z" fill={color} />
    </svg>
  );
}

type SquiggleProps = {
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
};

export function Squiggle({ width = 200, height = 30, color = '#EF3B9A', strokeWidth = 5, className }: SquiggleProps) {
  return (
    <svg className={className} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path
        d={`M5 ${height / 2} Q${width * 0.2} 0, ${width * 0.4} ${height / 2} T${width * 0.8} ${height / 2} T${width - 5} ${height / 2}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const trimmed = hex.replace('#', '');
  const r = parseInt(trimmed.substring(0, 2), 16);
  const g = parseInt(trimmed.substring(2, 4), 16);
  const b = parseInt(trimmed.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
