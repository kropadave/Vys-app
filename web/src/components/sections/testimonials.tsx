import { Marquee } from '@/components/animated/marquee';
import { Reveal } from '@/components/animated/reveal';
import { testimonials } from '@shared/content';

export function TestimonialsSection() {
  const doubled = [...testimonials, ...testimonials];

  return (
    <section className="mx-auto w-full max-w-[1180px] overflow-hidden py-16">
      <Reveal className="px-4">
        <div className="max-w-[780px]">
          <p className="text-xs font-black uppercase text-brand-pink">Říkají o nás</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-brand-ink md:text-5xl">
            Reálné reakce z naší komunity
          </h2>
        </div>
      </Reveal>

      <Marquee speed={42} className="mt-8 py-3">
        {doubled.map((item, idx) => (
            <article
              key={`${item.name}-${idx}`}
              className="flex w-[360px] shrink-0 flex-col gap-3 rounded-brand border border-brand-purple/12 bg-white p-6 shadow-brand-soft"
            >
              <span className="-mb-2 text-[54px] font-black leading-[40px] text-brand-pink">
                “
              </span>
              <p className="text-base font-semibold leading-6 text-brand-ink">{item.text}</p>
              <div className="mt-2 flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-brand bg-gradient-brand text-white font-black">
                  {item.name.charAt(0)}
                </span>
                <span className="text-[13px] font-black text-brand-ink">{item.name}</span>
              </div>
            </article>
        ))}
      </Marquee>
    </section>
  );
}
