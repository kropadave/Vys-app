export type CapacityActivityType = 'Kroužek' | 'Tábor' | 'Workshop';

export type CapacityProductLike = {
  id: string;
  type: CapacityActivityType;
  place: string;
  capacityTotal?: number;
};

export type CapacityPurchaseLike = {
  id?: string;
  productId: string;
  participantId: string;
  type: CapacityActivityType;
  place: string;
};

export type CapacityPassLike = {
  participantId: string;
  location: string;
  totalEntries: number;
  usedEntries: number;
};

export type ProductCapacity = {
  total: number;
  used: number;
  available: number;
  full: boolean;
  percent: number;
  status: 'available' | 'low' | 'full';
};

export const productCapacityLimits: Record<CapacityActivityType, number> = {
  Kroužek: 25,
  Tábor: 30,
  Workshop: 40,
};

export function defaultCapacityForType(type: CapacityActivityType) {
  return productCapacityLimits[type];
}

export function capacityForProduct(product: CapacityProductLike, purchases: CapacityPurchaseLike[], digitalPasses: CapacityPassLike[]): ProductCapacity {
  const total = product.capacityTotal ?? defaultCapacityForType(product.type);
  const used = product.type === 'Kroužek' ? activeCourseParticipants(product.place, digitalPasses) : registeredParticipants(product, purchases);
  const available = Math.max(total - used, 0);
  const percent = total > 0 ? Math.min(used / total, 1) : 1;
  const full = available <= 0;

  return {
    total,
    used,
    available,
    full,
    percent,
    status: full ? 'full' : available <= Math.max(3, Math.ceil(total * 0.15)) ? 'low' : 'available',
  };
}

export function capacityMapForProducts(products: CapacityProductLike[], purchases: CapacityPurchaseLike[], digitalPasses: CapacityPassLike[]) {
  return new Map(products.map((product) => [product.id, capacityForProduct(product, purchases, digitalPasses)]));
}

export function capacitySummary(capacity: ProductCapacity) {
  if (capacity.full) return `Plno · ${capacity.used}/${capacity.total}`;
  return `${capacity.available} volných míst · ${capacity.used}/${capacity.total}`;
}

function activeCourseParticipants(place: string, digitalPasses: CapacityPassLike[]) {
  const activeParticipants = new Set<string>();

  for (const pass of digitalPasses) {
    if (normalizePlace(pass.location) !== normalizePlace(place)) continue;
    if (remainingEntries(pass) <= 0) continue;
    activeParticipants.add(pass.participantId);
  }

  return activeParticipants.size;
}

function registeredParticipants(product: CapacityProductLike, purchases: CapacityPurchaseLike[]) {
  const participantKeys = new Set<string>();

  for (const purchase of purchases) {
    if (purchase.type !== product.type) continue;
    if (purchase.productId !== product.id) continue;
    participantKeys.add(purchase.participantId || purchase.id || `${purchase.productId}-${participantKeys.size}`);
  }

  return participantKeys.size;
}

function remainingEntries(pass: CapacityPassLike) {
  return Math.max(pass.totalEntries - pass.usedEntries, 0);
}

function normalizePlace(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}