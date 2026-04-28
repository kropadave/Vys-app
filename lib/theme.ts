/**
 * Centrální paleta + utility pro vzhled aplikace.
 * Vibe: dětský, hravý, jemné fialové tóny + zaoblené karty + pastel akcenty.
 */

export const Palette = {
  // Pozadí
  bg: '#F3EFFF',          // jemné lila pozadí celé app
  surface: '#FFFFFF',     // bílé karty
  surfaceAlt: '#EDE6FF',  // sekundární karta

  // Fialová škála (primary)
  primary50: '#F3EFFF',
  primary100: '#E5DBFF',
  primary200: '#CFB9FF',
  primary300: '#B79BFF',
  primary400: '#9B7BFF',
  primary500: '#7C5CFF',  // hlavní akcent
  primary600: '#6741E6',
  primary700: '#4F2DBF',

  // Akcenty
  accentYellow: '#FFC857', // CTA tlačítka jako v referenci
  accentYellow600: '#F5A524',
  accentMint: '#9EE6C9',
  accentPink: '#FFB6E1',
  accentSky: '#A6D8FF',

  // Text
  text: '#241B3A',
  textMuted: '#7B7290',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#3B2A00',

  // Status
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#E11D48',
  locked: '#B5AEC4',

  // Stíny
  shadow: 'rgba(98, 64, 213, 0.18)',
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Shadow = {
  card: {
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  soft: {
    shadowColor: Palette.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
};

// Gradient stops pro karty / hero sekce.
export const Gradients = {
  primary: ['#9B7BFF', '#6741E6'] as const,
  primarySoft: ['#E5DBFF', '#CFB9FF'] as const,
  hero: ['#B79BFF', '#7C5CFF'] as const,
  card: ['#FFFFFF', '#F6F1FF'] as const,
  yellow: ['#FFD980', '#FFB347'] as const,
};

// Mapování úrovně náramku → barvy v tématu (jemné lila/akcent místo původních).
export const BraceletPaletteByLevel: Record<number, { main: string; soft: string }> = {
  1: { main: '#CFB9FF', soft: '#EDE6FF' }, // bílý → lila
  2: { main: '#FFC857', soft: '#FFF1D6' }, // žlutý
  3: { main: '#FB8C5A', soft: '#FFE0CE' }, // oranžový
  4: { main: '#5BC79E', soft: '#D5F2E5' }, // zelený
  5: { main: '#241B3A', soft: '#CFB9FF' }, // černý
};
