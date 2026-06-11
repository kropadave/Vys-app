import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#8B1DFF',
          'purple-deep': '#5410B7',
          'purple-light': '#EFE4FF',
          pink: '#F12BB3',
          'pink-deep': '#B71482',
          orange: '#FFB21A',
          'orange-deep': '#E16B12',
          lime: '#FFE3A3',
          cyan: '#7C2DDB',
          mint: '#E879F9',
          ink: '#171220',
          'ink-soft': '#5D536F',
          'ink-deep': '#0C0714',
          paper: '#FFF9F0',
          surface: '#FFFFFF',
          'surface-alt': '#FFF1E0',
          night: '#1B1230',
          'night-deep': '#120B22',
          'night-soft': '#271A45',
          ember: '#8B1DFF',
          'ember-deep': '#5410B7',
          'ember-soft': '#F4EBFF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #8B1DFF 0%, #B23BFF 48%, #F12BB3 100%)',
        'gradient-brand-soft': 'linear-gradient(135deg, rgba(139,29,255,0.12) 0%, rgba(178,59,255,0.10) 48%, rgba(241,43,179,0.16) 100%)',
        'gradient-warm': 'linear-gradient(135deg, #F12BB3 0%, #8B1DFF 100%)',
        'gradient-cool': 'linear-gradient(135deg, #8B1DFF 0%, #F12BB3 100%)',
        'gradient-ember': 'linear-gradient(135deg, #8B1DFF 0%, #B23BFF 55%, #F12BB3 100%)',
        'gradient-night': 'linear-gradient(160deg, #1B1230 0%, #271A45 50%, #120B22 100%)',
      },
      borderRadius: {
        brand: '8px',
        'brand-lg': '8px',
      },
      boxShadow: {
        brand: '0 22px 60px rgba(83, 36, 140, 0.16)',
        'brand-soft': '0 12px 30px rgba(83, 36, 140, 0.10)',
        'brand-float': '0 28px 80px rgba(83, 36, 140, 0.20)',
        'glow-pink': '0 0 34px rgba(241, 43, 179, 0.22)',
        'glow-purple': '0 0 28px rgba(139, 29, 255, 0.18)',
        'glow-orange': '0 0 28px rgba(255, 178, 26, 0.30)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'track-dash': {
          '0%': { transform: 'translateX(-16px)' },
          '100%': { transform: 'translateX(16px)' },
        },
        'scan-line': {
          '0%': { transform: 'translateX(-30%)' },
          '100%': { transform: 'translateX(130%)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.56s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        marquee: 'marquee 32s linear infinite',
        'track-dash': 'track-dash 1.8s linear infinite alternate',
        'scan-line': 'scan-line 5.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
