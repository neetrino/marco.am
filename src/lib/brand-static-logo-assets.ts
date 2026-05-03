/**
 * Local logos under `public/assets/brands/` keyed by published brand `slug`.
 * Used when `Brand.logoUrl` is empty so the home rail still shows real artwork.
 */
export type BrandStaticLogoDimensions = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

const SLUG_TO_LOGO: Record<string, BrandStaticLogoDimensions> = {
  agt: { src: '/assets/brands/agt.webp', width: 395, height: 121 },
  bosch: { src: '/assets/brands/bosch.svg', width: 500, height: 114 },
  braun: { src: '/assets/brands/braun.svg', width: 399, height: 169 },
  'by-span': { src: '/assets/brands/by-span.webp', width: 790, height: 158 },
  carino: { src: '/assets/brands/carino.svg', width: 520, height: 140 },
  centek: { src: '/assets/brands/centek.svg', width: 914, height: 170 },
  delonghi: { src: '/assets/brands/delonghi.svg', width: 2337, height: 724 },
  'evo-gloss': { src: '/assets/brands/evo-gloss.svg', width: 165, height: 69 },
  egida: { src: '/assets/brands/egida.webp', width: 256, height: 256 },
  electrolux: { src: '/assets/brands/electrolux.svg', width: 1367, height: 177 },
  geepas: { src: '/assets/brands/geepas.webp', width: 2000, height: 738 },
  hausberg: { src: '/assets/brands/hausberg.webp', width: 320, height: 130 },
  hisense: { src: '/assets/brands/hisense.svg', width: 487, height: 78 },
  kastamonu: { src: '/assets/brands/kastamonu.svg', width: 1000, height: 300 },
  kenwood: { src: '/assets/brands/kenwood.svg', width: 1117, height: 177 },
  kumitel: { src: '/assets/brands/kumitel.svg', width: 1000, height: 150 },
  'lex-life-expert': { src: '/assets/brands/lex-life-expert.svg', width: 588, height: 196 },
  lg: { src: '/assets/brands/lg.svg', width: 512, height: 76 },
  luxell: { src: '/assets/brands/luxell.svg', width: 1000, height: 150 },
  marrbaxx: { src: '/assets/brands/marrbaxx.webp', width: 1000, height: 350 },
  midea: { src: '/assets/brands/midea.svg', width: 114, height: 44 },
  nnobel: { src: '/assets/brands/nnobel.webp', width: 216, height: 214 },
  panasonic: { src: '/assets/brands/panasonic.svg', width: 600, height: 92 },
  philips: { src: '/assets/brands/philips.svg', width: 500, height: 92 },
  samsung: { src: '/assets/brands/samsung.svg', width: 422, height: 140 },
  toshiba: { src: '/assets/brands/toshiba.svg', width: 800, height: 122 },
  'targen-your-kitchen': {
    src: '/assets/brands/targen-your-kitchen.svg',
    width: 460,
    height: 120,
  },
  vestel: { src: '/assets/brands/vestel.svg', width: 512, height: 111 },
};

/**
 * Returns a bundled logo asset when the slug matches a known file; otherwise null.
 */
export function resolveBrandStaticLogo(slug: string): BrandStaticLogoDimensions | null {
  const key = slug.trim().toLowerCase();
  return SLUG_TO_LOGO[key] ?? null;
}

/**
 * Product cards: match `slug` first, then treat normalized `name` as a slug key
 * (e.g. import slug `import-abc12` + name `LG` → `/assets/brands/lg.svg`).
 */
export function resolveBrandStaticLogoForDisplay(
  slug: string,
  name: string,
): BrandStaticLogoDimensions | null {
  const fromSlug = resolveBrandStaticLogo(slug);
  if (fromSlug) return fromSlug;
  const nameKey = name.trim().toLowerCase();
  if (nameKey.length === 0) return null;
  return resolveBrandStaticLogo(nameKey);
}

/**
 * When the DB slug is not a known key (e.g. `import-*`) but the brand name maps to a
 * bundled asset (e.g. `LG` → `lg.svg`), prefer that asset over `logoUrl` so the card
 * does not show a placeholder or wrong remote image.
 */
export function resolveBrandStaticLogoFromNameOnly(
  slug: string,
  name: string,
): BrandStaticLogoDimensions | null {
  if (resolveBrandStaticLogo(slug) !== null) return null;
  const nameKey = name.trim().toLowerCase();
  if (nameKey.length === 0) return null;
  return resolveBrandStaticLogo(nameKey);
}

/**
 * Ordered image URLs for product cards: bundled first when matched by name only, else remote first.
 */
export function buildBrandLogoCandidateSrcs(
  logoUrl: string | null | undefined,
  slug: string,
  name: string,
): string[] {
  const remote = logoUrl?.trim();
  const nameOnlyBundled = resolveBrandStaticLogoFromNameOnly(slug, name);
  const anyBundled = resolveBrandStaticLogoForDisplay(slug, name);

  const out: string[] = [];
  if (nameOnlyBundled?.src) {
    out.push(nameOnlyBundled.src);
  }
  if (remote && !out.includes(remote)) {
    out.push(remote);
  }
  if (anyBundled?.src && !out.includes(anyBundled.src)) {
    out.push(anyBundled.src);
  }
  return out;
}
