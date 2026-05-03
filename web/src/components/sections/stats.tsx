'use client';

import { Activity, MapPin, Sparkles, Trophy } from 'lucide-react';

import { AnimatedCounter } from '@/components/animated/animated-counter';
import { Reveal } from '@/components/animated/reveal';
import { stats } from '@shared/content';

const icons = [Activity, MapPin, Sparkles, Trophy];

export function StatsSection() {
  return (
    <section className="section-shell py-16">
      <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <Reveal>
          <div>
            <p className="text-xs font-black uppercase text-brand-cyan">TeamVYS v číslech</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-brand-ink md:text-5xl">
              Děti rostou, rodiče mají přehled.
            </h2>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <p className="max-w-[620px] text-base leading-7 text-brand-ink-soft lg:ml-auto">
            Nový web ukazuje nabídku, ale zároveň drží praktickou část projektu: platby, dokumenty, docházku a přístup pro rodiče i admina.
          </p>
        </Reveal>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const numeric = parseInt(stat.value.replace(/\D/g, ''), 10) || 0;
          const suffix = stat.value.replace(/[\d\s]/g, '');
          const Icon = icons[index % icons.length];
          return (
            <Reveal key={stat.label} delay={index * 80}>
              <div className="group h-full rounded-brand border border-brand-purple/12 bg-white p-6 shadow-brand-soft transition-transform hover:-translate-y-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-brand bg-gradient-brand text-white transition-transform group-hover:scale-105">
                  <Icon size={20} />
                </div>
                <span className="mt-7 block text-brand-ink">
                  <AnimatedCounter
                    to={numeric}
                    suffix={suffix}
                    duration={1500}
                    delay={index * 100 + 240}
                    className="text-4xl font-black md:text-5xl"
                  />
                </span>
                <p className="mt-2 text-sm font-bold text-brand-ink-soft">{stat.label}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
