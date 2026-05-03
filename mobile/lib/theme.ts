export const Palette = {
  bg: '#0F1115',
  surface: '#171A21',
  surfaceAlt: '#1F242E',
  border: '#2A2F3A',
  text: '#F4F6FA',
  textMuted: '#9AA3B2',
  primary: '#7C5CFF',
  primaryDark: '#5B3DEB',
  primarySoft: '#2A2150',
  accent: '#FFB020',
  accentSoft: '#3A2C0E',
  success: '#3DDC97',
  danger: '#FF5C7A',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;
