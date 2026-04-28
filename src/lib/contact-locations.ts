import type { LanguageCode } from './language';

export type ContactLocationId = 'yerevan' | 'argavand' | 'parakar';

/** WGS84 center for embedded map — pin sits at this point (refine via Google Maps if needed). */
export type ContactLocationMapCenter = {
  lat: number;
  lng: number;
  /** Google Maps zoom 1–21; 17–18 is typical for a storefront */
  zoom: number;
};

export type ContactLocation = {
  id: ContactLocationId;
  address: string;
  phones: readonly string[];
  map: ContactLocationMapCenter;
};

function resolveLang(lang: LanguageCode): 'hy' | 'ru' | 'en' {
  if (lang === 'hy') {
    return 'hy';
  }
  if (lang === 'ru') {
    return 'ru';
  }
  return 'en';
}

/**
 * Store / showroom locations (addresses and phones). Shared by Contact page and header pickers.
 */
export function getContactLocations(lang: LanguageCode): ContactLocation[] {
  const l = resolveLang(lang);

  return [
    {
      id: 'yerevan',
      address:
        l === 'hy'
          ? 'Ք․ Երևան Ալեք Մանուկյան 23'
          : l === 'ru'
            ? 'г. Ереван, Алек Манукян 23'
            : '23 Alek Manukyan St, Yerevan',
      phones: ['+374 93 52 04 06', '+374 98 19 04 06', '011 52 04 06'],
      map: { lat: 40.173852, lng: 44.521961, zoom: 18 },
    },
    {
      id: 'argavand',
      address:
        l === 'hy'
          ? 'Արգավանդ Օդանավակայան 1'
          : l === 'ru'
            ? 'Аргаванд, Аэропорт 1'
            : '1 Airport St, Argavand',
      phones: ['+374 93 58 04 09', '+374 41 34 04 06', '+374 77 64 04 06'],
      map: { lat: 40.1518, lng: 44.3962, zoom: 17 },
    },
    {
      id: 'parakar',
      address:
        l === 'hy'
          ? 'Գ. Փարաքար Մեսրոպ Մաշտոցի 1'
          : l === 'ru'
            ? 'с. Паракар, Месроп Маштоц 1'
            : '1 Mesrop Mashtots St, Parakar',
      phones: ['+374 77 51 04 06'],
      map: { lat: 40.163887, lng: 44.403473, zoom: 18 },
    },
  ];
}

export function phoneToTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/gu, '')}`;
}

export function mapsSearchUrlForAddress(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/**
 * Google Maps embed centered on exact coordinates — marker matches `map` pin.
 * (Address-only geocoding is too loose for a tight storefront view.)
 */
export function mapsEmbedUrlForLocation(location: ContactLocation): string {
  const { lat, lng, zoom } = location.map;
  const z = Math.min(21, Math.max(1, Math.round(zoom)));
  return `https://www.google.com/maps?q=${lat},${lng}&z=${z}&output=embed`;
}

const LOCATION_HASH_RE = /^#loc-(yerevan|argavand|parakar)$/;

export function parseContactLocationHash(hash: string): ContactLocationId | null {
  const match = LOCATION_HASH_RE.exec(hash);
  return match ? (match[1] as ContactLocationId) : null;
}

export function contactLocationMapHref(id: ContactLocationId): string {
  return `/contact#loc-${id}`;
}
