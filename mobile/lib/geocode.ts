// Lightweight geocoding via OpenStreetMap Nominatim (no API key required).
// Used when a coach adds a training spot so it gets real lat/lng and shows up
// on the map immediately. Falls back from full address → city centre so a spot
// always lands somewhere sensible in the Czech Republic.

export type GeocodeResult = { lat: number; lng: number };

type NominatimHit = { lat: string; lon: string };

async function queryNominatim(query: string): Promise<GeocodeResult | null> {
  const url =
    'https://nominatim.openstreetmap.org/search' +
    '?format=json&limit=1&countrycodes=cz&accept-language=cs' +
    `&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = (await res.json()) as NominatimHit[];
    const hit = json?.[0];
    if (!hit) return null;
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
      return { lat, lng };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve coordinates for a spot. Tries the most specific query first
 * (name + address + city), then address + city, then just the city. Returns
 * `null` only if every attempt fails (e.g. offline or unknown place).
 */
export async function geocodeSpot(parts: {
  name?: string;
  address?: string;
  city: string;
}): Promise<GeocodeResult | null> {
  const name = parts.name?.trim();
  const address = parts.address?.trim();
  const city = parts.city.trim();
  if (!city) return null;

  const queries: string[] = [];
  if (address) queries.push(`${address}, ${city}, Česko`);
  if (name) queries.push(`${name}, ${city}, Česko`);
  queries.push(`${city}, Česko`);

  for (const query of queries) {
    const hit = await queryNominatim(query);
    if (hit) return hit;
  }
  return null;
}
