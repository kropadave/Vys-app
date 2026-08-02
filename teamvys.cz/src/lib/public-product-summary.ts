import type { ParentProduct } from '@/lib/portal-content';

export function publicBaseProducts(products: ParentProduct[]) {
  return products.filter((product) => product.type !== 'Krouzek' || !product.id.endsWith('-15'));
}

export function publicProductStats(products: ParentProduct[]) {
  const baseProducts = publicBaseProducts(products);
  const courseProducts = baseProducts.filter((product) => product.type === 'Krouzek');
  const totalCapacity = baseProducts.reduce((sum, product) => sum + (product.capacityTotal ?? 0), 0);
  const registered = baseProducts.reduce((sum, product) => sum + (product.capacityCurrent ?? 0), 0);
  const cities = new Set(baseProducts.map((product) => product.city).filter(Boolean));

  return {
    offers: baseProducts.length,
    courseLocations: courseProducts.length,
    registered,
    totalCapacity,
    cities: cities.size,
  };
}

export function publicStatCards(products: ParentProduct[], loading: boolean) {
  const stats = publicProductStats(products);

  return [
    { value: loading ? '...' : String(stats.registered), label: 'zaplacených rezervací' },
    { value: loading ? '...' : String(stats.cities), label: 'měst v nabídce' },
    { value: loading ? '...' : String(stats.courseLocations), label: 'aktuálních kroužků' },
    { value: loading ? '...' : `${stats.registered}/${stats.totalCapacity}`, label: 'obsazenost kapacit' },
  ];
}

export function publicMarqueeItems(products: ParentProduct[]) {
  const locations = publicBaseProducts(products)
    .map((product) => product.place || `${product.city} · ${product.venue}`)
    .filter(Boolean);

  return Array.from(new Set(locations));
}
