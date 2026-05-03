import { camps, courses, workshops } from '@shared/content';

export type WebProduct = {
  id: string;
  type: 'Kroužek' | 'Tábor' | 'Workshop';
  title: string;
  place: string;
  priceLabel: string;
  priceAmount: number;
  meta: string;
  description: string;
};

export function findWebProduct(productId: string): WebProduct | null {
  const course = courses.find((item) => item.id === productId || `${item.id}-15` === productId);
  if (course) {
    const isFifteenEntries = productId.endsWith('-15');

    return {
      id: isFifteenEntries ? `${course.id}-15` : course.id,
      type: 'Kroužek',
      title: `Kroužek ${course.city}`,
      place: course.venue,
      priceLabel: isFifteenEntries ? '15 vstupů · 2590 Kč' : course.price,
      priceAmount: isFifteenEntries ? 2590 : course.priceAmount,
      meta: `${course.day} ${course.from}-${course.to}`,
      description: isFifteenEntries
        ? 'Výhodnější permanentka s 15 vstupy, NFC docházkou, skill tree a průběžným přehledem pro rodiče.'
        : 'Permanentka s NFC docházkou, skill tree a průběžným přehledem pro rodiče.',
    };
  }

  const camp = camps.find((item) => item.id === productId);
  if (camp) {
    return {
      id: camp.id,
      type: 'Tábor',
      title: `Příměstský tábor ${camp.place}`,
      place: camp.venue,
      priceLabel: camp.price,
      priceAmount: camp.priceAmount,
      meta: camp.season,
      description: camp.highlights.join(' · '),
    };
  }

  const workshop = workshops.find((item) => item.id === productId);
  if (workshop) {
    return {
      id: workshop.id,
      type: 'Workshop',
      title: workshop.place,
      place: workshop.city,
      priceLabel: workshop.price,
      priceAmount: Number.parseInt(workshop.price, 10),
      meta: workshop.date,
      description: workshop.body,
    };
  }

  return null;
}