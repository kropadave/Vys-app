'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ActivityType, ParentProduct } from '@/lib/portal-content';

const STORAGE_KEY = 'teamvys-admin-created-products-v1';
const CHANGE_EVENT = 'teamvys-admin-created-products-changed';

export type AdminProductInput = {
  type: ActivityType;
  title: string;
  city: string;
  venue: string;
  primaryMeta: string;
  price: number;
  capacityTotal: number;
  capacityCurrent: number;
  description: string;
  trainingFocus: string;
  /** Fotky jako base64 data-URL (kroužek / tábor) */
  photos?: string[];
  /** Vybraní trenéři pro produkt */
  coachIds?: string[];
  /** Název triku 1 (workshop) */
  workshopTrick1?: string;
  /** Název triku 2 (workshop) */
  workshopTrick2?: string;
  /** Název souboru videa triku 1 (jen referenční) */
  workshopTrick1VideoFile?: string;
  /** Název souboru videa triku 2 (jen referenční) */
  workshopTrick2VideoFile?: string;
};

export function useAdminCreatedProducts() {
  const [products, setProducts] = useState<ParentProduct[]>([]);

  useEffect(() => {
    function syncProducts() {
      setProducts(readAdminCreatedProducts());
    }

    syncProducts();
    window.addEventListener('storage', syncProducts);
    window.addEventListener(CHANGE_EVENT, syncProducts);
    return () => {
      window.removeEventListener('storage', syncProducts);
      window.removeEventListener(CHANGE_EVENT, syncProducts);
    };
  }, []);

  const addProduct = useCallback((input: AdminProductInput) => {
    const product = createAdminCreatedProduct(input);
    writeAdminCreatedProducts([product, ...readAdminCreatedProducts()]);
    return product;
  }, []);

  const removeProduct = useCallback((productId: string) => {
    writeAdminCreatedProducts(readAdminCreatedProducts().filter((product) => product.id !== productId));
  }, []);

  return { products, addProduct, removeProduct };
}

export function isAdminCreatedProduct(product: ParentProduct) {
  return product.id.startsWith('admin-created-');
}

export function readAdminCreatedProducts(): ParentProduct[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(sanitizeProduct).filter(Boolean) as ParentProduct[];
  } catch {
    return [];
  }
}

function writeAdminCreatedProducts(products: ParentProduct[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function createAdminCreatedProduct(input: AdminProductInput): ParentProduct {
  const type = input.type;
  const city = input.city.trim() || 'Vyškov';
  const venue = input.venue.trim() || (type === 'Workshop' ? 'Workshop hala' : 'Nová lokalita');
  const place = `${city} · ${venue}`;
  const price = Math.max(0, Math.round(input.price || defaultPrice(type)));
  const capacityTotal = Math.max(1, Math.round(input.capacityTotal || defaultCapacity(type)));
  const capacityCurrent = Math.max(0, Math.min(capacityTotal, Math.round(input.capacityCurrent || 0)));
  const primaryMeta = input.primaryMeta.trim() || defaultPrimaryMeta(type);
  const heroImage = defaultHeroImage(type);

  // Workshop název automaticky z triků
  const trick1 = input.workshopTrick1?.trim() ?? '';
  const trick2 = input.workshopTrick2?.trim() ?? '';
  const workshopAutoTitle = trick1 && trick2 ? `Workshop: ${trick1} + ${trick2}` : trick1 || trick2 ? `Workshop: ${trick1 || trick2}` : '';

  const title = input.title.trim() || workshopAutoTitle || defaultTitle(type, city, venue);
  const trainingFocus = input.trainingFocus
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  // Fotky: použij nahrané nebo výchozí
  const uploadedPhotos = input.photos && input.photos.length > 0 ? input.photos : null;
  const gallery = uploadedPhotos ? uploadedPhotos : [heroImage];

  return {
    id: `admin-created-${type.toLowerCase()}-${slugify(city)}-${slugify(venue)}-${Date.now()}`,
    type,
    title,
    city,
    place,
    venue,
    price,
    priceLabel: priceLabelFor(type, price),
    entriesTotal: type === 'Krouzek' ? 10 : undefined,
    capacityTotal,
    capacityCurrent,
    primaryMeta,
    secondaryMeta: secondaryMetaFor(type),
    description: input.description.trim() || defaultDescription(type, city),
    badge: badgeFor(type),
    heroImage: uploadedPhotos ? uploadedPhotos[0] : heroImage,
    gallery,
    coachIds: input.coachIds ?? [],
    importantInfo: importantInfoFor(type, primaryMeta, capacityCurrent, capacityTotal, trick1, trick2, input.workshopTrick1VideoFile, input.workshopTrick2VideoFile),
    trainingFocus: trainingFocus.length ? trainingFocus : defaultFocus(type),
  };
}

function sanitizeProduct(value: unknown): ParentProduct | null {
  if (!value || typeof value !== 'object') return null;
  const product = value as ParentProduct;
  if (!product.id || !product.type || !product.title || !product.place) return null;
  if (!['Krouzek', 'Tabor', 'Workshop'].includes(product.type)) return null;
  return {
    ...product,
    price: Number(product.price || 0),
    capacityTotal: Number(product.capacityTotal || 1),
    capacityCurrent: Number(product.capacityCurrent || 0),
    gallery: Array.isArray(product.gallery) && product.gallery.length ? product.gallery : [product.heroImage || defaultHeroImage(product.type)],
    coachIds: Array.isArray(product.coachIds) ? product.coachIds : [],
    importantInfo: Array.isArray(product.importantInfo) ? product.importantInfo : importantInfoFor(product.type, product.primaryMeta, product.capacityCurrent, product.capacityTotal),
    trainingFocus: Array.isArray(product.trainingFocus) ? product.trainingFocus : defaultFocus(product.type),
  };
}

function defaultTitle(type: ActivityType, city: string, venue: string) {
  if (type === 'Krouzek') return `Kroužek ${city}`;
  if (type === 'Tabor') return `Příměstský tábor ${city}`;
  return `${city} · ${venue}`;
}

function priceLabelFor(type: ActivityType, price: number) {
  if (type === 'Krouzek') return `10 vstupů · ${price.toLocaleString('cs-CZ')} Kč`;
  if (type === 'Tabor') return `Turnus ${price.toLocaleString('cs-CZ')} Kč`;
  return `${price.toLocaleString('cs-CZ')} Kč`;
}

function secondaryMetaFor(type: ActivityType) {
  if (type === 'Krouzek') return 'Digitální permanentka přes NFC čip';
  if (type === 'Tabor') return 'Dokumenty a QR vstup na první den';
  return 'QR ticket po zaplacení';
}

function badgeFor(type: ActivityType) {
  if (type === 'Krouzek') return 'Nový kroužek';
  if (type === 'Tabor') return 'Nový tábor';
  return 'Nový workshop';
}

function defaultPrice(type: ActivityType) {
  if (type === 'Krouzek') return 1790;
  if (type === 'Tabor') return 3890;
  return 890;
}

function defaultCapacity(type: ActivityType) {
  if (type === 'Krouzek') return 25;
  if (type === 'Tabor') return 30;
  return 40;
}

function defaultPrimaryMeta(type: ActivityType) {
  if (type === 'Krouzek') return 'Pondělí 16:00-17:00';
  if (type === 'Tabor') return 'Léto 2026';
  return 'Nový termín';
}

function defaultDescription(type: ActivityType, city: string) {
  if (type === 'Krouzek') return `Nový parkour kroužek v lokalitě ${city} s NFC docházkou, skill tree a rodičovským přehledem.`;
  if (type === 'Tabor') return `Nový příměstský tábor v lokalitě ${city} s digitálními dokumenty a QR kontrolou u vstupu.`;
  return `Nový workshop v lokalitě ${city} s QR ticketem a jasným zaměřením na konkrétní triky.`;
}

function defaultHeroImage(type: ActivityType) {
  if (type === 'Krouzek') return '/courses/prostejov_Prostejov_parkour_main.webp';
  if (type === 'Tabor') return '/courses/nadrazka_ZS-Nadrazka-Foto3.webp';
  return '/courses/brandys_BR4.webp';
}

function defaultFocus(type: ActivityType) {
  if (type === 'Krouzek') return ['bezpečné dopady', 'přeskoky', 'skill tree', 'NFC docházka'];
  if (type === 'Tabor') return ['parkour základy', 'týmové hry', 'venkovní výzvy', 'bezpečný režim'];
  return ['tic-tac', 'kong vault', 'flow', 'QR ticket'];
}

function importantInfoFor(type: ActivityType, primaryMeta: string, capacityCurrent: number, capacityTotal: number, trick1?: string, trick2?: string, trick1VideoFile?: string, trick2VideoFile?: string): ParentProduct['importantInfo'] {
  if (type === 'Krouzek') {
    return [
      { label: 'Permanentka', value: '10 vstupů na vybranou lokalitu' },
      { label: 'Čas', value: primaryMeta },
      { label: 'Kapacita', value: `${capacityCurrent}/${capacityTotal} dětí aktuálně přihlášeno` },
    ];
  }

  if (type === 'Tabor') {
    return [
      { label: 'Termín', value: primaryMeta },
      { label: 'Dokumenty', value: 'GDPR, souhlas, anamnéza, bezinfekčnost a vyzvedávání' },
      { label: 'Kapacita', value: `${capacityCurrent}/${capacityTotal} dětí aktuálně přihlášeno` },
    ];
  }

  // Workshop
  const info: ParentProduct['importantInfo'] = [
    { label: 'Ticket', value: 'QR ticket po zaplacení' },
    { label: 'Termín', value: primaryMeta },
    { label: 'Kapacita', value: `${capacityCurrent}/${capacityTotal} míst` },
  ];
  if (trick1) info.push({ label: 'Trik 1', value: trick1 + (trick1VideoFile ? ` · ${trick1VideoFile}` : '') });
  if (trick2) info.push({ label: 'Trik 2', value: trick2 + (trick2VideoFile ? ` · ${trick2VideoFile}` : '') });
  return info;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'produkt';
}
