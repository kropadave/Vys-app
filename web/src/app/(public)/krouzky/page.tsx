import { ArrowRight, Clock, MapPin, ScanLine, ShieldCheck, Trophy, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { Reveal } from '@/components/animated/reveal';
import { PageHero } from '@/components/page-hero';
import { AdminCreatedCourseCards } from '@/components/public-admin-products';
import { courseHero } from '@/lib/photos';
import { courses } from '@shared/content';

export const metadata = {
  title: 'Kroužky',
  description: 'Pravidelné parkour kroužky v 6 městech. Permanentky 10 nebo 15 vstupů s NFC docházkou.',
};

export default function CoursesPage() {
  const sortedCourses = [...courses].sort((a, b) => a.city.localeCompare(b.city, 'cs') || a.venue.localeCompare(b.venue, 'cs'));
  const totalCapacity = courses.reduce((sum, course) => sum + course.capacityTotal, 0);
  const registered = courses.reduce((sum, course) => sum + course.capacityCurrent, 0);

  return (
    <>
      <PageHero
        eyebrow="Pravidelné kroužky"
        title="Najdi parkour kroužek u tebe ve městě"
        body="Trénujeme v 6 městech, na ověřených sportovištích, s certifikovanými trenéry. Permanentka 10 nebo 15 vstupů s NFC docházkou bez papírování."
        image="/courses/prostejov_Prostejov_parkour_main.webp"
        mascotSrc="/vys-maskot-no-logo2.png"
        mascotPosition="top-right"
        mascotScale="oversized"
      />

      <section className="section-shell relative grid gap-3 py-12 md:grid-cols-3">
        <Benefit icon={<ScanLine size={20} />} pillar="10 nebo 15 vstupů" title="Permanentka, ne závazek" body="Vstupy se odečítají postupně přes NFC čip." />
        <Benefit icon={<ShieldCheck size={20} />} pillar="Bezpečný postup" title="Trénink od základů" body="Dopady, koordinace a triky se skládají krok za krokem." />
        <Benefit icon={<Trophy size={20} />} pillar="Skill tree" title="Pokrok je vidět" body="Dítě sbírá XP, odemyká triky a postupuje náramky." />
      </section>

      <section className="section-shell py-10">
        <Reveal>
          <div className="relative flex flex-col gap-4 rounded-[34px] border border-brand-purple/12 bg-white p-6 shadow-brand-soft lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[720px]">
              <p className="text-xs font-black uppercase text-brand-cyan">Aktuální lokality</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-brand-ink md:text-4xl">Kroužky přehledně na jedné stránce</h2>
              <p className="mt-3 text-sm font-bold leading-6 text-brand-ink-soft md:text-base">
                Vyber konkrétní tělocvičnu, zkontroluj čas, kapacitu a po rozkliknutí uvidíš i trenéry pro danou lokaci.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[390px]">
              <SummaryTile value={`${courses.length}`} label="lokalit" />
              <SummaryTile value={`${registered}/${totalCapacity}`} label="dětí" />
              <SummaryTile value="10 / 15" label="vstupů" />
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sortedCourses.map((course, index) => (
            <CourseCard key={course.id} course={course} delay={index * 55} />
          ))}
          <AdminCreatedCourseCards startDelay={sortedCourses.length * 55} />
        </div>
      </section>
    </>
  );
}

function CourseCard({ course, delay }: { course: (typeof courses)[number]; delay: number }) {
  const photo = courseHero[course.id];

  return (
    <Reveal delay={delay} className="h-full">
      <Link
        href={`/krouzky/${course.id}`}
        className="group grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-[30px] border border-brand-purple/12 bg-white shadow-brand-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/24 hover:shadow-brand"
      >
        <div className="relative h-[245px] bg-brand-paper">
          {photo ? (
            <>
              <Image
                src={photo}
                alt={course.venue}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(23,18,32,0)_48%,rgba(23,18,32,0.44)_100%)]" />
            </>
          ) : null}
          <span className="absolute left-3 top-3 rounded-[16px] bg-white px-3 py-2 text-xs font-black uppercase text-brand-ink shadow-brand-soft">
            {course.city}
          </span>
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-[16px] bg-white px-3 py-2 text-xs font-black text-brand-purple shadow-brand-soft">
            <Users size={14} />
            {course.capacityTotal - course.capacityCurrent} volných
          </span>
        </div>

        <div className="flex h-full flex-col p-5">
          <div className="grid min-h-[86px] grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h3 className="text-xl font-black leading-tight text-brand-ink">{course.venue}</h3>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-brand-ink-soft">
                <MapPin size={16} className="text-brand-orange" />
                {course.city}
              </p>
            </div>
            <span className="shrink-0 rounded-[16px] bg-brand-purple-light px-3 py-2 text-xs font-black text-brand-purple-deep">
              {course.price}
            </span>
          </div>

          <div className="mt-4 grid min-h-[80px] gap-2 rounded-[22px] bg-brand-paper p-3 text-sm font-bold text-brand-ink">
            <span className="inline-flex items-center gap-2">
              <Clock size={16} className="text-brand-cyan" />
              {course.day} {course.from}-{course.to}
            </span>
            <span className="inline-flex items-start gap-2 leading-5">
              <ScanLine size={16} className="text-brand-pink" />
              NFC permanentka 10 nebo 15 vstupů
            </span>
          </div>

          <CapacityMeter current={course.capacityCurrent} total={course.capacityTotal} />

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-black/10 pt-4">
            <p className="text-xs font-black uppercase text-slate-400">Detail lokality a trenéři</p>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-brand text-white transition-transform group-hover:translate-x-1">
              <ArrowRight size={19} />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

function SummaryTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[22px] border border-brand-purple/10 bg-white px-4 py-3 text-center shadow-brand-soft">
      <p className="text-xl font-black text-brand-ink">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-brand-ink-soft">{label}</p>
    </div>
  );
}

function CapacityMeter({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const remaining = Math.max(0, total - current);

  return (
    <div className="mt-4 rounded-[22px] bg-brand-paper p-3">
      <div className="flex items-center justify-between gap-3 text-xs font-black">
        <span className="text-brand-ink">{current}/{total} dětí</span>
        <span className="text-brand-cyan">{remaining} volných míst</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-cyan" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Benefit({ icon, pillar, title, body }: { icon: React.ReactNode; pillar: string; title: string; body: string }) {
  return (
    <Reveal>
      <div className="h-full rounded-[28px] border border-brand-purple/12 bg-white p-5 shadow-brand-soft">
        <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-gradient-brand text-white">{icon}</span>
        <p className="mt-5 text-xs font-black uppercase text-brand-cyan">{pillar}</p>
        <h3 className="mt-2 text-lg font-black text-brand-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      </div>
    </Reveal>
  );
}
