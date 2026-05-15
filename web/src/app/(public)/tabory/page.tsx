import { ClipboardCheck, Shirt, Smartphone, Users, Utensils, UtensilsCrossed } from 'lucide-react';

import { Reveal } from '@/components/animated/reveal';
import { PageHero } from '@/components/page-hero';
import { PublicCampCatalog } from '@/components/public-admin-products';
import { campSchedule } from '@shared/content';

export const metadata = {
  title: 'Tábory',
  description: 'Příměstské parkour tábory TeamVYS s trenéry, programem, jídlem a digitálními dokumenty pro rodiče.',
};

export default function CampsPage() {
  return (
    <>
      <PageHero
        eyebrow="Příměstské tábory"
        title="Týden pohybu, her a parkour výzev"
        body="Letní tábory stavíme tak, aby si děti užily bezpečný trénink, nové kamarády a jasný režim dne. Rodič po přihlášení vyřeší platbu, dokumenty i údaje pro trenéra na jednom místě."
        mascotSrc="/vys-maskot-no-logo3.png"
        mascotPosition="bottom-right"
        mascotScale="oversized"
      />

      {/* Included + schedule */}
      <section className="section-shell grid items-start gap-5 py-10 lg:grid-cols-[1.02fr_0.98fr]">

        {/* Co je v ceně */}
        <Reveal>
          <div className="group relative overflow-hidden rounded-[32px] bg-white shadow-brand transition-shadow duration-500 hover:shadow-brand-float">
            {/* gradient border */}
            <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,rgba(139,29,255,0.28),rgba(241,43,179,0.18),rgba(255,178,26,0.22))_border-box]" />

            {/* header */}
            <div className="relative border-b border-brand-purple/10 bg-gradient-to-br from-brand-paper via-white to-white px-6 py-5 md:px-8">
              <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:linear-gradient(135deg,rgba(139,29,255,0.04),rgba(241,43,179,0.02))]" />
              <p className="relative gradient-text text-xs font-black uppercase tracking-widest">Co je v ceně</p>
              <h2 className="relative mt-1 text-xl font-black text-brand-ink">Vše bez skrytých příplatků</h2>
              <p className="relative mt-2 max-w-[520px] text-sm leading-6 text-brand-ink-soft">
                Tábor má jasný režim, vybavení i zázemí v jedné ceně. Rodič dopředu vyřeší dokumenty online a první den už jen nahlásí dítě jménem.
              </p>
            </div>

            <div className="relative grid gap-3 p-4 sm:grid-cols-2 md:p-5">
              {/* 1 */}
              <div className="flex items-start gap-4 rounded-[24px] border border-brand-orange/15 bg-brand-orange/[0.045] p-4 transition-transform duration-300 hover:-translate-y-0.5 md:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-orange/25 bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 shadow-[0_10px_24px_rgba(255,178,26,0.12)]">
                  <Utensils size={20} className="text-brand-orange" />
                </div>
                <div>
                  <p className="text-sm font-black text-brand-ink">Jídlo a pitný režim</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-brand-ink-soft">Obědy a svačiny po celý den, zdravá strava i pitný režim.</p>
                </div>
              </div>
              {/* 2 */}
              <div className="flex items-start gap-4 rounded-[24px] border border-brand-pink/15 bg-brand-pink/[0.045] p-4 transition-transform duration-300 hover:-translate-y-0.5 md:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-pink/25 bg-gradient-to-br from-brand-pink/20 to-brand-pink/5 shadow-[0_10px_24px_rgba(241,43,179,0.12)]">
                  <Shirt size={20} className="text-brand-pink" />
                </div>
                <div>
                  <p className="text-sm font-black text-brand-ink">Letní TeamVYS tričko</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-brand-ink-soft">Designové tričko z nové letní kolekce TeamVYS.</p>
                </div>
              </div>
              {/* 3 */}
              <div className="flex items-start gap-4 rounded-[24px] border border-brand-purple/15 bg-brand-purple/[0.045] p-4 transition-transform duration-300 hover:-translate-y-0.5 md:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-purple/25 bg-gradient-to-br from-brand-purple/20 to-brand-purple/5 shadow-[0_10px_24px_rgba(139,29,255,0.12)]">
                  <Users size={20} className="text-brand-purple" />
                </div>
                <div>
                  <p className="text-sm font-black text-brand-ink">Trenéři a animátoři</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-brand-ink-soft">Certifikovaní trenéři a animátoři, kteří děti opravdu baví.</p>
                </div>
              </div>
              {/* 4 */}
              <div className="flex items-start gap-4 rounded-[24px] border border-brand-cyan/15 bg-brand-cyan/[0.045] p-4 transition-transform duration-300 hover:-translate-y-0.5 md:p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-cyan/25 bg-gradient-to-br from-brand-cyan/20 to-brand-cyan/5 shadow-[0_10px_24px_rgba(124,45,219,0.12)]">
                  <UtensilsCrossed size={20} className="text-brand-cyan" />
                </div>
                <div>
                  <p className="text-sm font-black text-brand-ink">Trénink, hry a výzvy</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-brand-ink-soft">Bohatý program: trénink, hry, překážková dráha i kreativní výzvy.</p>
                </div>
              </div>
            </div>

            <div className="relative border-t border-brand-purple/10 bg-gradient-to-r from-brand-purple/[0.06] via-brand-pink/[0.045] to-brand-orange/[0.07] px-6 py-5 md:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-brand-ink">Bez ranního papírování</p>
                  <p className="mt-1 text-sm leading-6 text-brand-ink-soft">Přihláška, souhlasy a anamnéza jsou připravené v systému pro trenéra.</p>
                </div>
                <div className="inline-flex w-max items-center gap-2 rounded-[18px] border border-brand-purple/15 bg-white/75 px-3 py-2 text-xs font-black uppercase tracking-wide text-brand-purple-deep shadow-brand-soft">
                  <ClipboardCheck size={15} />
                  Připraveno online
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Right column */}
        <Reveal delay={90}>
          <div className="flex h-full flex-col gap-5">

            {/* Typický den */}
            <div className="group relative overflow-hidden rounded-[32px] bg-white shadow-brand-soft transition-shadow duration-500 hover:shadow-brand">
              <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,rgba(241,43,179,0.28),rgba(139,29,255,0.18))_border-box]" />

              <div className="relative border-b border-brand-purple/10 bg-gradient-to-br from-brand-paper via-white to-white px-6 py-5 md:px-8">
                <p
                  className="text-xs font-black uppercase tracking-widest"
                  style={{ background: 'linear-gradient(135deg,#F12BB3,#8B1DFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  Harmonogram
                </p>
                <h2 className="mt-1 text-xl font-black text-brand-ink">Typický den</h2>
              </div>

              <div className="relative px-6 py-3 md:px-8">
                {/* slot 0 */}
                <div className="relative flex items-start gap-4 py-3">
                  <div className="absolute left-[9px] top-[22px] h-full w-0.5 bg-gradient-to-b from-brand-purple/50 to-brand-pink/10" />
                  <div className="relative mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-pink shadow-[0_2px_8px_rgba(139,29,255,0.35)]">
                    <div className="h-2 w-2 rounded-full bg-white/90" />
                  </div>
                  <div className="flex-1 rounded-2xl bg-brand-purple/5 px-3 py-2 transition-transform duration-200 hover:translate-x-0.5">
                    <span className="text-[11px] font-black uppercase tracking-wide text-brand-purple">{campSchedule[0]?.time}</span>
                    <p className="mt-0.5 text-sm font-black text-brand-ink">{campSchedule[0]?.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-brand-ink-soft">{campSchedule[0]?.text}</p>
                  </div>
                </div>
                {/* slot 1 */}
                <div className="relative flex items-start gap-4 py-3">
                  <div className="absolute left-[9px] top-[22px] h-full w-0.5 bg-gradient-to-b from-brand-orange/50 to-brand-pink/10" />
                  <div className="relative mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-brand-pink shadow-[0_2px_8px_rgba(255,178,26,0.40)]">
                    <div className="h-2 w-2 rounded-full bg-white/90" />
                  </div>
                  <div className="flex-1 rounded-2xl bg-brand-orange/5 px-3 py-2 transition-transform duration-200 hover:translate-x-0.5">
                    <span className="text-[11px] font-black uppercase tracking-wide text-brand-orange">{campSchedule[1]?.time}</span>
                    <p className="mt-0.5 text-sm font-black text-brand-ink">{campSchedule[1]?.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-brand-ink-soft">{campSchedule[1]?.text}</p>
                  </div>
                </div>
                {/* slot 2 */}
                <div className="relative flex items-start gap-4 py-3">
                  <div className="absolute left-[9px] top-[22px] h-full w-0.5 bg-gradient-to-b from-brand-pink/50 to-brand-purple/10" />
                  <div className="relative mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-pink to-brand-purple shadow-[0_2px_8px_rgba(241,43,179,0.40)]">
                    <div className="h-2 w-2 rounded-full bg-white/90" />
                  </div>
                  <div className="flex-1 rounded-2xl bg-brand-pink/5 px-3 py-2 transition-transform duration-200 hover:translate-x-0.5">
                    <span className="text-[11px] font-black uppercase tracking-wide text-brand-pink">{campSchedule[2]?.time}</span>
                    <p className="mt-0.5 text-sm font-black text-brand-ink">{campSchedule[2]?.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-brand-ink-soft">{campSchedule[2]?.text}</p>
                  </div>
                </div>
                {/* slot 3 — last, no connector */}
                <div className="relative flex items-start gap-4 py-3">
                  <div className="relative mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-cyan to-brand-purple shadow-[0_2px_8px_rgba(124,45,219,0.35)]">
                    <div className="h-2 w-2 rounded-full bg-white/90" />
                  </div>
                  <div className="flex-1 rounded-2xl bg-brand-cyan/5 px-3 py-2 transition-transform duration-200 hover:translate-x-0.5">
                    <span className="text-[11px] font-black uppercase tracking-wide text-brand-cyan">{campSchedule[3]?.time}</span>
                    <p className="mt-0.5 text-sm font-black text-brand-ink">{campSchedule[3]?.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-brand-ink-soft">{campSchedule[3]?.text}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* App features */}
            <div className="group relative overflow-hidden rounded-[32px] bg-white shadow-brand-soft transition-shadow duration-500 hover:shadow-brand">
              <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,rgba(139,29,255,0.22),rgba(255,178,26,0.18))_border-box]" />
              <div className="relative divide-y divide-brand-purple/10">
                <div className="flex items-start gap-4 px-6 py-4 transition-colors duration-200 hover:bg-brand-purple/[0.025] md:px-8">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brand-purple/20 bg-gradient-to-br from-brand-purple/15 to-brand-pink/10">
                    <ClipboardCheck size={18} className="text-brand-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-brand-ink">Příchod bez papírů</p>
                    <p className="mt-0.5 text-xs leading-5 text-brand-ink-soft">1. den stačí přijít a nahlásit jméno — trenér zkontroluje přihlášku přímo v systému.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 px-6 py-4 transition-colors duration-200 hover:bg-brand-pink/[0.025] md:px-8">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-brand-pink/20 bg-gradient-to-br from-brand-pink/15 to-brand-orange/10">
                    <Smartphone size={18} className="text-brand-pink" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-brand-ink">Dokumenty online</p>
                    <p className="mt-0.5 text-xs leading-5 text-brand-ink-soft">GDPR, souhlas, anamnéza a bezinfekčnost přímo v portálu.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Reveal>
      </section>

      <PublicCampCatalog />
    </>
  );
}
