'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  delay?: number;
  offset?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'header' | 'footer' | 'main';
} & Omit<HTMLMotionProps<'div'>, 'children'>;

const motionTags = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  footer: motion.footer,
  main: motion.main,
} as const;

export function Reveal({ children, delay = 0, offset = 18, className, as = 'div', ...rest }: Props) {
  const Tag = motionTags[as] as typeof motion.div;
  return (
    <Tag
      initial={{ opacity: 0, y: offset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.56, delay: delay / 1000, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function ScaleIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.86 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: delay / 1000, type: 'spring', damping: 14, stiffness: 130, mass: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
