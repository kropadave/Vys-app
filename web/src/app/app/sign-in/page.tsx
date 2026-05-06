import { Dumbbell, QrCode, Trophy } from 'lucide-react';
import Image from 'next/image';
import { Suspense } from 'react';

import { AppInstallButton } from '@/components/app-install-button';
import { AppSignInForm } from '@/components/app/app-sign-in-form';

export const metadata = {
  title: 'Přihlášení',
};

const highlights = [
  { icon: Trophy, label: 'Skill tree a XP' },
  { icon: QrCode, label: 'QR triky' },
  { icon: Dumbbell, label: 'Trenérská docházka' },
];

export default function AppSignInPage() {
  return (
    <main className="min-h-dvh overflow-hidden bg-[#140E26] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-40px)] w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.35)] md:p-8">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(20,200,255,0.22),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(241,43,179,0.22),transparent_26%),linear-gradient(135deg,rgba(139,29,255,0.28),rgba(255,178,26,0.08))]" />
          <div className="relative flex min-h-[520px] flex-col justify-between gap-10">
            <div className="flex items-center gap-3">
              <Image src="/vys-logo-mark.png" alt="TeamVYS" width={44} height={44} className="rounded-[16px] bg-white p-1.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/58">Instalovatelná appka</p>
                <p className="text-xl font-black tracking-wide">TEAMVYS</p>
              </div>
            </div>

            <div className="max-w-[500px]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-lime">Jen účastník + trenér</p>
              <h1 className="mt-4 text-4xl font-black leading-[1.03] md:text-6xl">Appka bez zbytku webu.</h1>
              <p className="mt-5 text-base font-bold leading-7 text-white/72 md:text-lg">
                Po přidání na plochu se otevře jen tahle část TeamVYS. Rodičovský profil a admin zůstávají na běžném webu.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-[18px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <item.icon size={20} className="text-brand-lime" />
                  <p className="mt-3 text-sm font-black text-white">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[#FBFAFE] p-5 text-brand-ink shadow-[0_28px_90px_rgba(0,0,0,0.28)] md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-purple">Přístup do appky</p>
              <h2 className="mt-1 text-2xl font-black text-brand-ink">Účastník nebo trenér</h2>
            </div>
            <AppInstallButton label="Přidat na plochu" compact />
          </div>
            <Suspense fallback={<div className="rounded-[18px] bg-brand-paper p-5 text-sm font-bold text-brand-ink-soft">Načítám přihlášení...</div>}>
              <AppSignInForm />
            </Suspense>
        </section>
      </div>
    </main>
  );
}