// Light-first design system for TeamVYS — sjednoceno s webem (paper #FFF9F0, purple #8B1DFF, pink #F12BB3).

export const Palette = {
  bg: '#FFF9F0',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF1E0',
  surfaceRaised: '#FFFFFF',
  surfaceDeep: '#171220',
  surfaceTint: 'rgba(139,29,255,0.06)',
  surfaceGlass: '#FFFFFF',
  surfaceGlassRaised: '#FFF6E6',
  border: 'rgba(23,18,32,0.08)',
  borderStrong: 'rgba(139,29,255,0.30)',
  borderNeutral: 'rgba(23,18,32,0.06)',
  text: '#171220',
  textInverse: '#FFFFFF',
  textMuted: '#5D536F',
  textSubtle: '#8A8399',
  primary: '#8B1DFF',
  primaryDark: '#5410B7',
  primaryLight: '#EFE4FF',
  primarySoft: 'rgba(139,29,255,0.10)',
  primarySofter: 'rgba(139,29,255,0.05)',
  accent: '#FFB21A',
  accentSoft: 'rgba(255,178,26,0.16)',
  pink: '#F12BB3',
  pinkSoft: 'rgba(241,43,179,0.14)',
  cyan: '#14C8FF',
  cyanSoft: 'rgba(20,200,255,0.16)',
  lime: '#FFD84A',
  limeSoft: 'rgba(255,216,74,0.20)',
  success: '#1FB37A',
  successSoft: 'rgba(31,179,122,0.14)',
  danger: '#F0445B',
  dangerSoft: 'rgba(240,68,91,0.12)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 6,
  md: 8,
  lg: 14,
  xl: 20,
  xxl: 28,
  pill: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#5D536F',
    shadowOpacity: 0.16,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4,
  },
  soft: {
    shadowColor: '#5D536F',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  float: {
    shadowColor: '#5D536F',
    shadowOpacity: 0.20,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 22 },
    elevation: 8,
  },
  hero: {
    shadowColor: '#8B1DFF',
    shadowOpacity: 0.28,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 24 },
    elevation: 12,
  },
  glow: {
    shadowColor: '#F12BB3',
    shadowOpacity: 0.32,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  glowPurple: {
    shadowColor: '#8B1DFF',
    shadowOpacity: 0.34,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  glowOrange: {
    shadowColor: '#FFB21A',
    shadowOpacity: 0.36,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
} as const;

export const Easing = {
  swift: [0.22, 1, 0.36, 1] as const,
  gentle: [0.4, 0, 0.2, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
};
