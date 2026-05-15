'use client';

import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock, CreditCard, MapPin, ScanLine, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Reveal } from '@/components/animated/reveal';
import { useAdminCreatedProducts } from '@/lib/admin-created-products';
import { type ParentProduct } from '@/lib/portal-content';
import { usePublicCoaches, type PublicCoachSummary } from '@/lib/use-public-coaches';

export function AdminCreatedWorkshopCards({ startDelay = 0 }: { startDelay?: number }) {
  const { products, loading, error } = useAdminCreatedProducts();
  const { coachesForIds } = usePublicCoaches();
  const workshops = products.filter((product) => product.type === 'Workshop');

  if (loading) {
    return <CatalogInlineState label="Načítám aktuální workshopy..." />;
  }

  if (error) {
    return <CatalogInlineState label="Aktuální workshopy se nepodařilo načíst." />;
  }

  if (workshops.length === 0) {
    return (
      <div className="col-span-full rounded-brand border border-brand-purple/12 bg-white p-8 shadow-brand-soft">
        <p className="text-xs font-black uppercase text-brand-orange">Brzy</p>
        <h3 className="mt-2 text-xl font-black text-brand-ink">Žádné aktuální workshopy</h3>
        <p className="mt-2 text-sm font-bold leading-6 text-brand-ink-soft">Nové workshopy přidáváme průběžně. Sleduj nás na sociálních sítích nebo se přihlas do portálu a dostaneš upozornění, jakmile vypíšeme termín.</p>
      </div>
    );
  }

  return (
    <>
      {workshops.map((workshop, index) => (
        <Reveal key={workshop.id} delay={startDelay + index * 80}>
          <WorkshopPublicCard product={workshop} coaches={coachesForIds(workshop.coachIds ?? [])} />
        </Reveal>
      ))}
    </>
  );
}

function CatalogInlineState({ label }: { label: string }) {
  return (
    <div className="col-span-full rounded-brand border border-brand-purple/12 bg-white p-8 text-sm font-black text-brand-ink-soft shadow-brand-soft">
      {label}
    </div>
  );
}

export function AdminCreatedCourseCards({ startDelay = 0 }: { startDelay?: number }) {
  const { products } = useAdminCreatedProducts();
  // Filtruj 15vstupové varianty — zobrazujeme jen 10vstupovou kartu, cena "od X Kč" zahrnuje obě
  const courses = products
    .filter((product) => product.type === 'Krouzek' && !product.id.endsWith('-15'))
    .sort((a, b) => a.city.localeCompare(b.city, 'cs') || a.venue.localeCompare(b.venue, 'cs'));

  return (
    <>
      {courses.map((course, index) => (
        <CoursePublicCard key={course.id} product={course} delay={startDelay + index * 55} />
      ))}
    </>
  );
}

export function PublicCourseCatalog() {
  const { products, loading, error } = useAdminCreatedProducts();
  const courses = publicProductsByType(products, 'Krouzek');
  const totalCapacity = courses.reduce((sum, course) => sum + course.capacityTotal, 0);
  const registered = courses.reduce((sum, course) => sum + course.capacityCurrent, 0);

  return (
    <section className="section-shell py-10">
      <Reveal>
        <div className="relative flex flex-col gap-4 rounded-[34px] border border-brand-purple/12 bg-white p-6 shadow-brand-soft lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[720px]">
            <p className="text-xs font-black uppercase text-brand-cyan">Aktuální lokality</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-brand-ink md:text-4xl">Kroužky přehledně na jedné stránce</h2>
            <p className="mt-3 text-sm font-bold leading-6 text-brand-ink-soft md:text-base">
              Vyber konkrétní tělocvičnu, zkontroluj čas, kapacitu podle zaplacených rezervací a po rozkliknutí uvidíš i trenéry pro danou lokaci.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:min-w-[390px]">
            <CatalogSummaryTile value={loading ? '...' : `${courses.length}`} label="lokalit" />
            <CatalogSummaryTile value={loading ? '...' : `${registered}/${totalCapacity}`} label="dětí" />
            <CatalogSummaryTile value="10 / 15" label="vstupů" />
          </div>
        </div>
      </Reveal>

      <CatalogState loading={loading} error={error} empty={!loading && courses.length === 0} emptyTitle="Žádné kroužky nejsou aktuálně vypsané" emptyText="Jakmile admin zveřejní lokalitu v databázi, objeví se tady s aktuální kapacitou." />

      {courses.length > 0 ? (
        <div className="mt-6 grid auto-rows-fr gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course, index) => (
            <CoursePublicCard key={course.id} product={course} delay={index * 55} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function PublicCampCatalog() {
  const { products, loading, error } = useAdminCreatedProducts();
  const { coachesForIds } = usePublicCoaches();
  const camps = publicProductsByType(products, 'Tabor');

  return (
    <section className="section-shell py-10">
      <Reveal>
        <div className="max-w-[760px]">
          <p className="text-xs font-black uppercase text-brand-cyan">Aktuální turnusy</p>
          <h2 className="mt-2 text-2xl font-black text-brand-ink md:text-4xl">Vyber místo a rezervuj dítěti místo</h2>
        </div>
      </Reveal>

      <CatalogState loading={loading} error={error} empty={!loading && camps.length === 0} emptyTitle="Žádné tábory nejsou aktuálně vypsané" emptyText="Turnusy se zobrazují až z publikovaných produktů v administraci." />

      {camps.length > 0 ? (
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {camps.map((camp, index) => (
            <Reveal key={camp.id} delay={index * 80}>
              <CampPublicCard product={camp} coaches={coachesForIds(camp.coachIds ?? [])} />
            </Reveal>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function publicProductsByType(products: ParentProduct[], type: ParentProduct['type']) {
  return products
    .filter((product) => product.type === type && (type !== 'Krouzek' || !product.id.endsWith('-15')))
    .sort((a, b) => a.city.localeCompare(b.city, 'cs') || a.venue.localeCompare(b.venue, 'cs'));
}

function CatalogSummaryTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[22px] border border-brand-purple/10 bg-white px-4 py-3 text-center shadow-brand-soft">
      <p className="text-xl font-black text-brand-ink">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-brand-ink-soft">{label}</p>
    </div>
  );
}

function CatalogState({ loading, error, empty, emptyTitle, emptyText }: { loading: boolean; error: string | null; empty: boolean; emptyTitle: string; emptyText: string }) {
  if (loading) {
    return <div className="mt-6 rounded-brand border border-brand-purple/12 bg-white p-5 text-sm font-black text-brand-ink-soft shadow-brand-soft">Načítám aktuální nabídku...</div>;
  }

  if (error) {
    return <div className="mt-6 rounded-brand border border-brand-orange/25 bg-white p-5 text-sm font-black text-brand-ink-soft shadow-brand-soft">Nabídku se nepodařilo načíst: {error}</div>;
  }

  if (empty) {
    return (
      <div className="mt-6 rounded-brand border border-brand-purple/12 bg-white p-6 shadow-brand-soft">
        <p className="text-xs font-black uppercase text-brand-orange">Brzy</p>
        <h3 className="mt-2 text-xl font-black text-brand-ink">{emptyTitle}</h3>
        <p className="mt-2 text-sm font-bold leading-6 text-brand-ink-soft">{emptyText}</p>
      </div>
    );
  }

  return null;
}

export function AdminCreatedCourseDetail({ productId }: { productId: string }) {
  const { products } = useAdminCreatedProducts();
  const { coachesForIds } = usePublicCoaches();
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
          <h1 className="text-2xl font-black text-brand-ink">Kroužek není aktuálně zveřejněný</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-brand-ink-soft">Detail se zobrazuje jen pro publikované produkty z databáze.</p>
        </div>
      </article>
    );
  }

  const gallery = product.gallery.length ? product.gallery : [product.heroImage];
  const [hero, ...rest] = gallery;
  const { day, time } = splitCourseMeta(product.primaryMeta);
  const coaches = coachesForIds(product.coachIds ?? []);

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
                {coaches.length > 0 ? coaches.map((coach) => <CoachCompact key={coach.id} name={coach.name} photoUrl={coach.photoUrl} />) : <p className="rounded-brand bg-brand-paper p-3 text-sm font-bold leading-6 text-brand-ink-soft">Trenér se pro tuto lokaci doplní v administraci.</p>}
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

function CampPublicCard({ product, coaches = [] }: { product: ParentProduct; coaches?: PublicCoachSummary[] }) {
  const hasImage = Boolean(product.heroImage);
  return (
    <article className="group h-full overflow-hidden rounded-[30px] border border-brand-purple/12 bg-white shadow-brand transition-all duration-300 hover:-translate-y-1 hover:shadow-brand-float">
      <div className={`relative h-56 overflow-hidden ${hasImage ? '' : 'bg-[radial-gradient(ellipse_at_top_left,#a855f7_0%,#7c3aed_45%,#5b21b6_100%)]'}`}>
        {hasImage ? (
          <ProductImage src={product.heroImage} alt={product.venue} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div aria-hidden className="absolute inset-0 diagonal-rails opacity-[0.07]" />
        )}
        <div aria-hidden className={`absolute inset-0 bg-gradient-to-t ${hasImage ? 'from-black/70 via-black/20 to-transparent' : 'from-black/30 via-transparent to-transparent'}`} />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-[16px] bg-white/95 px-3 py-1.5 text-xs font-black uppercase text-brand-ink shadow-sm backdrop-blur-sm">
          <CalendarDays size={13} className="text-brand-orange" />
          {product.primaryMeta}
        </span>
        <div className="absolute bottom-4 left-4 pr-4">
          <h3 className="text-2xl font-black text-white drop-shadow-sm">{product.venue}</h3>
          <p className="mt-0.5 text-sm font-bold text-white/80">{product.place}</p>
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-slate-400">Cena</p>
            <p className="mt-1 text-2xl font-black text-brand-ink">{product.priceLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-black uppercase text-slate-400">Kapacita</p>
            <p className="mt-1 text-lg font-black text-brand-ink">{product.capacityCurrent}/{product.capacityTotal} dětí</p>
          </div>
        </div>
        <CourseCapacityMeter current={product.capacityCurrent} total={product.capacityTotal} />
        <p className="mt-5 text-sm font-bold leading-6 text-brand-ink-soft">{product.description}</p>
        {product.trainingFocus.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.trainingFocus.slice(0, 5).map((focus) => (
              <span key={focus} className="rounded-[14px] bg-brand-cyan/10 px-3 py-1.5 text-xs font-black text-brand-cyan">{focus}</span>
            ))}
          </div>
        ) : null}
        {coaches.length > 0 ? (
          <div className="mt-5 border-t border-black/10 pt-4">
            <p className="text-xs font-black uppercase text-slate-400">Trenéři tábora</p>
            <div className="mt-3 grid gap-2">
              {coaches.map((coach) => <CoachCompact key={coach.id} name={coach.name} photoUrl={coach.photoUrl} />)}
            </div>
          </div>
        ) : null}
        <Link href={`/sign-in?next=/checkout/${product.id}`} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-brand bg-gradient-brand px-6 py-4 text-sm font-black text-white shadow-brand-soft transition-transform hover:-translate-y-0.5">
          Rezervovat a zaplatit
          <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
}

function WorkshopPublicCard({ product, coaches = [] }: { product: ParentProduct; coaches?: PublicCoachSummary[] }) {
  return (
    <article className="h-full overflow-hidden rounded-brand border border-brand-purple/12 bg-white shadow-brand">
      <div className="relative h-48 overflow-hidden bg-brand-paper">
        <ProductImage src={product.heroImage} alt={product.venue} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
        <div className="absolute bottom-4 left-4 pr-4">
          <p className="text-xs font-black uppercase text-brand-lime">{product.city}</p>
          <h3 className="mt-1 text-2xl font-black text-white">{product.venue}</h3>
        </div>
      </div>
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
        {product.trainingFocus.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {product.trainingFocus.map((focus) => (
              <span key={focus} className="rounded-[14px] bg-brand-cyan/10 px-3 py-1.5 text-xs font-black text-brand-cyan">{focus}</span>
            ))}
          </div>
        ) : null}
        <p className="mt-4 inline-flex gap-2 text-sm font-bold text-brand-ink"><CheckCircle2 size={18} className="text-brand-cyan" /> QR ticket po zaplacení</p>
        {coaches.length > 0 ? (
          <div className="mt-5 border-t border-black/10 pt-4">
            <p className="text-xs font-black uppercase text-slate-400">Trenéři workshopu</p>
            <div className="mt-3 grid gap-2">
              {coaches.map((coach) => <CoachCompact key={coach.id} name={coach.name} photoUrl={coach.photoUrl} />)}
            </div>
          </div>
        ) : null}
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
  if (!src) return null;
  return <img src={src} alt={alt} className={className} />;
}

function CoachCompact({ name, photoUrl }: { name: string; photoUrl: string }) {
  return (
    <div className="flex items-center gap-3 rounded-brand bg-brand-paper p-3">
      <ProductImage src={photoUrl} alt={name} className="h-10 w-10 rounded-brand bg-white object-contain p-1.5" />
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-brand-ink">{name}</p>
        <p className="mt-0.5 text-xs font-bold text-brand-ink-soft">Trenér TeamVYS</p>
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