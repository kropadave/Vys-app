import { ArrowLeft, ArrowRight, CalendarDays, Clock, CreditCard, Mail, MapPin, Phone, ScanLine, ShieldCheck, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Reveal } from '@/components/animated/reveal';
import { AdminCreatedCourseDetail } from '@/components/public-admin-products';
import { courseGallery } from '@/lib/photos';
import { parentProducts, trainersForProduct, type ParentProductTrainer } from '@/lib/portal-content';
import { courses } from '@shared/content';

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  return courses.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const course = courses.find((c) => c.id === id);
  if (!course) return { title: 'Kroužek nenalezen' };
  return {
    title: `${course.city} · ${course.venue}`,
    description: `Parkour kroužek ${course.venue} v ${course.city}, ${course.day} ${course.from}–${course.to}.`,
  };
}

export default async function CourseDetail({ params }: Props) {
  const { id } = await params;
  const course = courses.find((c) => c.id === id);
  if (!course) {
    if (id.startsWith('admin-created-')) return <AdminCreatedCourseDetail productId={id} />;
    notFound();
  }

  const gallery = courseGallery[course.id] ?? [];
  const [hero, ...rest] = gallery;
  const courseProduct = parentProducts.find((product) => product.id === course.id);
  const trainers = courseProduct ? trainersForProduct(courseProduct) : [];

  return (
    <article className="section-shell py-10">
      <Reveal>
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
          <Link href="/krouzky" className="inline-flex items-center gap-2 text-brand-ink-soft transition-colors hover:text-brand-purple">
            <ArrowLeft size={17} />
            Všechny kroužky
          </Link>
        </div>
      </Reveal>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <Reveal>
          <div className="space-y-3">
            {hero ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-brand bg-white shadow-brand-float">
                <Image src={hero} alt={course.venue} fill priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(23,18,32,0)_42%,rgba(23,18,32,0.68)_100%)]" />
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <p className="text-sm font-black uppercase text-brand-lime">{course.city}</p>
                  <h1 className="mt-2 text-4xl font-black leading-tight md:text-6xl">{course.venue}</h1>
                </div>
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-brand border border-brand-purple/12 bg-white">
                <span className="text-2xl font-black gradient-text">{course.city}</span>
              </div>
            )}
            {rest.length ? (
              <div className="grid grid-cols-3 gap-3">
                {rest.slice(0, 6).map((src, idx) => (
                  <div key={idx} className="relative aspect-square overflow-hidden rounded-brand bg-white shadow-brand-soft">
                    <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="sticky top-24 rounded-brand border border-brand-purple/12 bg-white p-6 shadow-brand">
            <div>
              <p className="text-xs font-black uppercase text-brand-cyan">Rezervace kroužku</p>
              <h2 className="mt-2 text-3xl font-black text-brand-ink">{course.city} · {course.venue}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Permanentka 10 nebo 15 vstupů s NFC docházkou, skill tree a rodičovským přehledem.</p>
            </div>

            <div className="mt-5 grid gap-3 text-sm font-bold text-slate-700">
              <Stat icon={<CalendarDays size={18} />} label="Den" value={course.day} />
              <Stat icon={<Clock size={18} />} label="Čas" value={`${course.from}-${course.to}`} />
              <Stat icon={<Users size={18} />} label="Živá kapacita" value={`${course.capacityCurrent}/${course.capacityTotal} dětí`} />
              <Stat icon={<MapPin size={18} />} label="Místo" value={`${course.city} · ${course.venue}`} />
            </div>
            <CapacityMeter current={course.capacityCurrent} total={course.capacityTotal} />

            <TrainerCompactList trainers={trainers} />

            <div className="mt-5 border-t border-black/10 pt-5">
              <p className="text-xs font-black uppercase text-slate-400">Co je v ceně</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>Permanentka 10 nebo 15 vstupů</li>
                <li>NFC docházka v rodičovském přehledu</li>
                <li>Skill tree s XP a barevnými náramky</li>
                <li>Profesionální trenéři a žíněnky</li>
              </ul>
            </div>

            <Link
              href={`/sign-in?next=/checkout/${course.id}`}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-brand bg-gradient-brand px-6 py-4 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5"
            >
              <CreditCard size={18} />
              Rezervovat a zaplatit {course.price}
            </Link>
            <p className="mt-3 inline-flex items-center justify-center gap-2 text-center text-xs font-bold text-slate-500">
              <ScanLine size={15} />
              Platba kartou přes Stripe, potvrzení e-mailem.
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={160}>
        <section className="mt-8 border-y border-brand-purple/10 py-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-brand-cyan">Trenéři</p>
              <h2 className="mt-2 text-2xl font-black text-brand-ink md:text-4xl">Kdo učí na této lokaci</h2>
            </div>
            <p className="max-w-[520px] text-sm font-bold leading-6 text-brand-ink-soft md:text-right">
              Trenéři jsou přiřazení podle lokality. Rodič je po přihlášení uvidí i v portálu u docházky a hodnocení.
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {trainers.length > 0 ? trainers.map((trainer) => <TrainerCard key={trainer.id} trainer={trainer} />) : <TrainerFallback />}
          </div>
        </section>
      </Reveal>

      <Reveal delay={180}>
        <Link href="/krouzky" className="mt-10 inline-flex items-center gap-2 rounded-brand border border-brand-purple/12 bg-white px-5 py-3 text-sm font-black text-brand-ink shadow-brand-soft transition-transform hover:-translate-y-0.5">
          Další lokality
          <ArrowRight size={17} />
        </Link>
      </Reveal>
    </article>
  );
}

function TrainerCompactList({ trainers }: { trainers: ParentProductTrainer[] }) {
  return (
    <div className="mt-5 border-t border-black/10 pt-5">
      <p className="text-xs font-black uppercase text-slate-400">Trenéři na lokaci</p>
      <div className="mt-3 grid gap-2">
        {trainers.length > 0 ? trainers.map((trainer) => (
          <div key={trainer.id} className="flex items-center gap-3 rounded-brand bg-brand-paper p-3">
            <Image src={trainer.profilePhotoUrl} alt={trainer.name} width={42} height={42} className="h-10 w-10 rounded-brand bg-white object-contain p-1.5" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-brand-ink">{trainer.name}</p>
              <p className="mt-0.5 text-xs font-bold text-brand-ink-soft">{trainer.qrTricksApproved} potvrzených QR triků</p>
            </div>
          </div>
        )) : (
          <p className="rounded-brand bg-brand-paper p-3 text-sm font-bold leading-6 text-brand-ink-soft">Trenér se pro tuto lokaci doplní v administraci.</p>
        )}
      </div>
    </div>
  );
}

function TrainerCard({ trainer }: { trainer: ParentProductTrainer }) {
  return (
    <article className="rounded-brand border border-brand-purple/12 bg-white p-5 shadow-brand-soft">
      <div className="flex items-start gap-4">
        <Image src={trainer.profilePhotoUrl} alt={trainer.name} width={64} height={64} className="h-16 w-16 rounded-brand bg-brand-paper object-contain p-2" />
        <div className="min-w-0">
          <h3 className="text-lg font-black text-brand-ink">{trainer.name}</h3>
          <p className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-brand-ink-soft"><ShieldCheck size={16} className="text-brand-cyan" /> Aktivní trenér</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm font-bold text-brand-ink-soft">
        <span className="inline-flex items-center gap-2"><Phone size={16} className="text-brand-purple" /> {trainer.phone}</span>
        <span className="inline-flex items-center gap-2"><Mail size={16} className="text-brand-pink" /> {trainer.email}</span>
        <span className="inline-flex items-center gap-2"><ScanLine size={16} className="text-brand-cyan" /> {trainer.qrTricksApproved} potvrzených triků</span>
      </div>
    </article>
  );
}

function TrainerFallback() {
  return (
    <div className="rounded-brand border border-brand-purple/12 bg-white p-5 shadow-brand-soft md:col-span-2 lg:col-span-3">
      <h3 className="text-lg font-black text-brand-ink">Trenér bude upřesněn</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-brand-ink-soft">Tato lokalita je připravená pro rezervace, ale veřejné přiřazení trenéra ještě není zveřejněné.</p>
    </div>
  );
}

function CapacityMeter({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const remaining = Math.max(0, total - current);

  return (
    <div className="mt-4 rounded-brand bg-brand-paper p-4">
      <div className="flex items-center justify-between gap-3 text-xs font-black">
        <span className="text-brand-ink">Aktuálně přihlášeno {current}/{total}</span>
        <span className="text-brand-cyan">{remaining} volných míst</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-cyan" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-brand bg-brand-paper p-3">
      <span className="mt-0.5 text-brand-cyan">{icon}</span>
      <div>
        <p className="text-xs font-black uppercase text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-black text-brand-ink">{value}</p>
      </div>
    </div>
  );
}
