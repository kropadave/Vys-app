import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'TeamVYS — parkour kroužky pro děti',
    template: '%s · TeamVYS',
  },
  description:
    'Parkour kroužky v 6 městech, příměstské tábory a workshopy. Skill tree, NFC docházka, profi trenéři. TeamVYS — největší parkourová komunita v ČR.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'TeamVYS — parkour kroužky pro děti',
    description: 'Skill tree, NFC docházka, 500+ dětí, 6 měst, profi trenéři.',
    type: 'website',
    locale: 'cs_CZ',
  },
  icons: {
    icon: '/vys-logo-mark.png',
    apple: '/vys-logo-mark.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#FBFAFE',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs" className={inter.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
