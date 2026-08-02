'use client';

import { ArrowRight, Fingerprint, Trophy, Wallet2 } from 'lucide-react';
import Link from 'next/link';

import { Reveal } from '@/components/animated/reveal';

import { RoutePath } from './route-path';

const roles = [
  {
    icon: Trophy,
    title: 'Dítě',
    lead: 'Hraje hru, ne jen cvičí.',
    body: 'Skill tree, XP za nové triky a náramky, co ho ženou k dalšímu levelu.',
  },
  {
    icon: Wallet2,
    title: 'Rodič',
    lead: 'Přehled bez volání trenérovi.',
    body: 'Docházka, platby a permanentka na jednom místě, notifikace rovnou na mobil.',
  },
  {
    icon: Fingerprint,
    title: 'Trenér',
    lead: 'Docházka za pár vteřin.',
    body: 'NFC čip nebo QR kód místo papírového archu, výplata podle odtrénovaných hodin.',
  },
] as const;

export function AppDifferentiator() {
  return (
    <section className="relative overflow-hidden bg-[#0B0B10] py-16 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_16%_18%,rgba(139,29,255,0.16),transparent_40%),radial-gradient(circle_at_84%_82%,rgba(178,59,255,0.10),transparent_44%)]"
      />

      <div className="section-shell relative">
        <div className="relative">
          <RoutePath />
          <div className="relative grid gap-5 sm:grid-cols-3">
            {roles.map((role, index) => (
              <Reveal key={role.title} delay={index * 90}>
                <div className="flex h-full flex-col gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-[13px] bg-brand-purple/[0.18] text-brand-purple-light">
                    <role.icon size={19} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-white/50">{role.title}</p>
                    <p className="mt-1 text-[15px] font-black leading-snug text-white">{role.lead}</p>
                  </div>
                  <p className="text-[13px] leading-5 text-white/60">{role.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={260} className="mt-9 flex justify-center">
          <Link
            href="/aplikace"
            className="inline-flex items-center gap-2 rounded-full bg-brand-purple px-5 py-3 text-sm font-black text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple-light focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B10]"
          >
            Zjistit víc o appce
            <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
