import type { LanguageCode } from './language';

export type ContactLocationId = 'yerevan' | 'argavand' | 'parakar';

export type ContactLocation = {
  id: ContactLocationId;
  address: string;
  phones: readonly string[];
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
    },
  ];
}

export function phoneToTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/gu, '')}`;
}

export function mapsSearchUrlForAddress(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
