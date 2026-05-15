'use client';

import { Marquee } from '@/components/animated/marquee';
import { useAdminCreatedProducts } from '@/lib/admin-created-products';
import { publicMarqueeItems } from '@/lib/public-product-summary';

const coreItems = ['NFC docházka', 'Stripe platby', 'Skill tree', 'Rodičovský profil', 'QR workshopy'];

export function TrustMarquee() {
  const { products } = useAdminCreatedProducts();
  const liveItems = publicMarqueeItems(products);
  const items = [...liveItems, ...coreItems];

  return (
    <section className="overflow-hidden py-5">
      <Marquee speed={34} className="py-2">
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="flex items-center gap-3 whitespace-nowrap rounded-brand border border-brand-purple/12 bg-white px-4 py-2.5 text-sm font-black text-brand-ink shadow-brand-soft"
          >
            <span className="h-2 w-2 rounded-full bg-brand-pink" />
            {item}
          </span>
        ))}
      </Marquee>
    </section>
  );
}
