import type { Metadata, Viewport } from 'next';

import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: {
    default: 'TeamVYS aplikace',
    template: '%s · TeamVYS aplikace',
  },
  description: 'Instalovatelná TeamVYS aplikace pro účastníky a trenéry.',
  manifest: '/app/manifest.webmanifest',
  icons: {
    icon: '/vys-logo-mark.png',
    apple: '/vys-logo-mark.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#140E26',
  width: 'device-width',
  initialScale: 1,
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#140E26] text-white">
      <PwaRegister />
      {children}
    </div>
  );
}