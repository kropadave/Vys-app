export const CoachColors = {
  bg: '#F8F7FB',
  panel: '#FFFFFF',
  panelAlt: '#F4F1FA',
  slate: '#201A2E',
  slateMuted: '#6D667A',
  border: 'rgba(32,26,46,0.10)',
  borderStrong: 'rgba(124,58,237,0.22)',
  blue: '#7C3AED',
  blueSoft: 'rgba(124,58,237,0.10)',
  pink: '#D946EF',
  pinkSoft: 'rgba(217,70,239,0.10)',
  teal: '#159A74',
  tealSoft: 'rgba(21,154,116,0.11)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245,158,11,0.13)',
  red: '#E2475D',
  redSoft: 'rgba(226,71,93,0.12)',
};

export const CoachShadow = {
  panel: {
    shadowColor: '#201A2E',
    shadowOpacity: 0.09,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  soft: {
    shadowColor: '#201A2E',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
} as const;