'use client';

import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock, CreditCard, MapPin, ScanLine, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Reveal } from '@/components/animated/reveal';
import { useAdminCreatedProducts } from '@/lib/admin-created-products';
import { adminCoachSummaries, type AdminCoachSummary, type ParentProduct } from '@/lib/portal-content';

export function AdminCreatedWorkshopCards({ startDelay = 0 }: { startDelay?: number }) {
  const { products } = useAdminCreatedProducts();
  const workshops = products.filter((product) => product.type === 'Workshop');

  return (
    <>
      {workshops.map((workshop, index) => (
        <Reveal key={workshop.id} delay={startDelay + index * 80}>
          <WorkshopPublicCard product={workshop} />
        </Reveal>
      ))}
    </>
  );
}

export function AdminCreatedCourseCards({ startDelay = 0 }: { startDelay?: number }) {
  const { products } = useAdminCreatedProducts();
  const courses = products.filter((product) => product.type === 'Krouzek').sort((a, b) => a.city.localeCompare(b.city, 'cs') || a.venue.localeCompare(b.venue, 'cs'));

  return (
    <>
      {courses.map((course, index) => (
        <CoursePublicCard key={course.id} product={course} delay={startDelay + index * 55} />
      ))}
    </>
  );
}

export function AdminCreatedCourseDetail({ productId }: { productId: string }) {
  const { products } = useAdminCreatedProducts();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => setLoaded(true), []);

  const product = products.find((item) => item.id === productId && item.type === 'Krouzek');

  if (!loaded) {
    return (
      <article className="section-shell py-10">
        <div className="rounded-brand border border-brand-purple/12 bg-white p-6 text-sm font-bold text-brand-ink-soft shadow-brand-soft">Načítám kroužek...</div>
      </article>
    );
  }

  if (!product) {
    return (
      <article className="section-shell py-10">
        <Link href="/krouzky" className="inline-flex items-center gap-2 text-sm font-bold text-brand-ink-soft transition-colors hover:text-brand-purple">
          <ArrowLeft size={17} />
          Všechny kroužky
        </Link>
        <div className="mt-7 rounded-brand border border-brand-purple/12 bg-white p-6 shadow-brand-soft">
          <h1 className="text-2xl font-black text-brand-ink">Kroužek není v tomto prohlížeči uložený</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-brand-ink-soft">Adminem vytvořené položky jsou zatím lokální demo data. Po napojení databáze se detail zobrazí všem stejně.</p>
        </div>
      </article>
    );
  }

  const gallery = product.gallery.length ? product.gallery : [product.heroImage];
  const [hero, ...rest] = gallery;
  const { day, time } = splitCourseMeta(product.primaryMeta);
  const coaches = coachesForProduct(product);

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
            <div className="relative aspect-[4/3] overflow-hidden rounded-brand bg-white shadow-brand-float">
              <ProductImage src={hero} alt={product.venue} className="h-full w-full object-cover" />
              <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(23,18,32,0)_42%,rgba(23,18,32,0.68)_100%)]" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <p className="text-sm font-black uppercase text-brand-lime">{product.city}</p>
                <h1 className="mt-2 text-4xl font-black leading-tight md:text-6xl">{product.venue}</h1>
              </div>
            </div>
            {rest.length ? (
              <div className="grid grid-cols-3 gap-3">
                {rest.slice(0, 6).map((src, idx) => (
                  <div key={`${src}-${idx}`} className="relative aspect-square overflow-hidden rounded-brand bg-white shadow-brand-soft">
                    <ProductImage src={src} alt="" className="h-full w-full object-cover" />
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
              <h2 className="mt-2 text-3xl font-black text-brand-ink">{product.city} · {product.venue}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Permanentka 10 nebo 15 vstupů s NFC docházkou, skill tree a rodičovským přehledem.</p>
            </div>

            <div className="mt-5 grid gap-3 text-sm font-bold text-slate-700">
              <Stat icon={<CalendarDays size={18} />} label="Den" value={day} />
              <Stat icon={<Clock size={18} />} label="Čas" value={time} />
              <Stat icon={<Users size={18} />} label="Živá kapacita" value={`${product.capacityCurrent}/${product.capacityTotal} dětí`} />
              <Stat icon={<MapPin size={18} />} label="Místo" value={`${product.city} · ${product.venue}`} />
            </div>
            <CourseCapacityMeter current={product.capacityCurrent} total={product.capacityTotal} />

            <div className="mt-5 border-t border-black/10 pt-5">
              <p className="text-xs font-black uppercase text-slate-400">Trenéři na lokaci</p>
              <div className="mt-3 grid gap-2">
                {coaches.length > 0 ? coaches.map((coach) => <CoachCompact key={coach.id} coach={coach} />) : <p className="rounded-brand bg-brand-paper p-3 text-sm font-bold leading-6 text-brand-ink-soft">Trenér se pro tuto lokaci doplní v administraci.</p>}
              </div>
            </div>

            <div className="mt-5 border-t border-black/10 pt-5">
              <p className="text-xs font-black uppercase text-slate-400">Co je v ceně</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>Permanentka 10 nebo 15 vstupů</li>
                <li>NFC docházka v rodičovském přehledu</li>
                <li>Skill tree s XP a barevnými náramky</li>
                <li>Profesionální trenéři a žíněnky</li>
              </ul>
            </div>

            <Link href={`/sign-in?next=/checkout/${product.id}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-brand bg-gradient-brand px-6 py-4 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5">
              <CreditCard size={18} />
              Rezervovat a zaplatit {coursePriceLabel(product)}
            </Link>
            <p className="mt-3 inline-flex items-center justify-center gap-2 text-center text-xs font-bold text-slate-500">
              <ScanLine size={15} />
              Platba kartou přes Stripe, potvrzení e-mailem.
            </p>
          </div>
        </Reveal>
      </div>
    </article>
  );
}

function WorkshopPublicCard({ product }: { product: ParentProduct }) {
  return (
    <article className="h-full overflow-hidden rounded-brand border border-brand-purple/12 bg-white shadow-brand">
      <div className="p-6 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-block rounded-brand bg-brand-cyan/12 px-3 py-2 text-xs font-black uppercase text-brand-cyan">{product.city}</span>
            <h3 className="mt-3 text-2xl font-black text-brand-ink md:text-3xl">{product.place}</h3>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs font-black uppercase text-slate-400">Cena</p>
            <p className="mt-1 text-2xl font-black text-brand-ink">{product.price.toLocaleString('cs-CZ')} Kč</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Info label="Termín" value={product.primaryMeta} />
          <Info label="Kapacita" value={`${product.capacityCurrent}/${product.capacityTotal} míst`} />
        </div>
        <WorkshopCapacityMeter current={product.capacityCurrent} total={product.capacityTotal} />
        <p className="mt-5 text-sm leading-6 text-slate-600">{product.description}</p>
        <p className="mt-4 inline-flex gap-2 text-sm font-bold text-brand-ink"><CheckCircle2 size={18} className="text-brand-cyan" /> QR ticket po zaplacení</p>
        <Link href={`/sign-in?next=/checkout/${product.id}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-brand bg-gradient-brand px-6 py-4 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5">
          Koupit ticket
          <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
}

function CoursePublicCard({ product, delay }: { product: ParentProduct; delay: number }) {
  return (
    <Reveal delay={delay} className="h-full">
      <Link href={`/krouzky/${product.id}`} className="group grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-[30px] border border-brand-purple/12 bg-white shadow-brand-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-purple/24 hover:shadow-brand">
        <div className="relative h-[245px] bg-brand-paper">
          <ProductImage src={product.heroImage} alt={product.venue} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(23,18,32,0)_48%,rgba(23,18,32,0.44)_100%)]" />
          <span className="absolute left-3 top-3 rounded-[16px] bg-white px-3 py-2 text-xs font-black uppercase text-brand-ink shadow-brand-soft">{product.city}</span>
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-[16px] bg-white px-3 py-2 text-xs font-black text-brand-purple shadow-brand-soft">
            <Users size={14} />
            {Math.max(product.capacityTotal - product.capacityCurrent, 0)} volných
          </span>
        </div>

        <div className="flex h-full flex-col p-5">
          <div className="grid min-h-[86px] grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h3 className="text-xl font-black leading-tight text-brand-ink">{product.venue}</h3>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-brand-ink-soft">
                <MapPin size={16} className="text-brand-orange" />
                {product.city}
              </p>
            </div>
            <span className="shrink-0 rounded-[16px] bg-brand-purple-light px-3 py-2 text-xs font-black text-brand-purple-deep">{coursePriceLabel(product)}</span>
          </div>

          <div className="mt-4 grid min-h-[80px] gap-2 rounded-[22px] bg-brand-paper p-3 text-sm font-bold text-brand-ink">
            <span className="inline-flex items-center gap-2">
              <Clock size={16} className="text-brand-cyan" />
              {product.primaryMeta}
            </span>
            <span className="inline-flex items-start gap-2 leading-5">
              <ScanLine size={16} className="text-brand-pink" />
              NFC permanentka 10 nebo 15 vstupů
            </span>
          </div>

          <CourseCapacityMeter current={product.capacityCurrent} total={product.capacityTotal} />

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

function ProductImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  return <img src={src} alt={alt} className={className} />;
}

function CoachCompact({ coach }: { coach: AdminCoachSummary }) {
  return (
    <div className="flex items-center gap-3 rounded-brand bg-brand-paper p-3">
      <ProductImage src={coach.profilePhotoUrl ?? '/vys-logo-mark.png'} alt={coach.name} className="h-10 w-10 rounded-brand bg-white object-contain p-1.5" />
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-brand-ink">{coach.name}</p>
        <p className="mt-0.5 text-xs font-bold text-brand-ink-soft">{coach.qrTricksApproved} potvrzených QR triků</p>
      </div>
    </div>
  );
}

function WorkshopCapacityMeter({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const remaining = Math.max(0, total - current);

  return (
    <div className="mt-4 rounded-brand bg-brand-paper p-3">
      <div className="flex items-center justify-between gap-3 text-xs font-black">
        <span className="text-brand-ink">Aktuálně {current}/{total}</span>
        <span className="text-brand-cyan">{remaining} volných míst</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-brand-cyan" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function CourseCapacityMeter({ current, total }: { current: number; total: number }) {
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-brand bg-brand-paper p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-brand-ink">{value}</p>
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

function splitCourseMeta(primaryMeta: string) {
  const match = primaryMeta.match(/^(.*)\s+(\d{1,2}:\d{2}.*)$/);
  return match ? { day: match[1], time: match[2] } : { day: primaryMeta, time: primaryMeta };
}

function coursePriceLabel(product: ParentProduct) {
  return `od ${product.price.toLocaleString('cs-CZ')} Kč`;
}

function coachesForProduct(product: ParentProduct) {
  return (product.coachIds ?? [])
    .map((coachId) => adminCoachSummaries.find((coach) => coach.id === coachId))
    .filter(Boolean) as AdminCoachSummary[];
}