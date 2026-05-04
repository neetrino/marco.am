/**
 * Local logos under `public/assets/brands/` keyed by published brand `slug`.
 * Used when `Brand.logoUrl` is empty so the home rail still shows real artwork.
 */
export type BrandStaticLogoDimensions = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

/** `geepas.webp` has wide transparent margins — scale artwork inside the logo cell for clearer mark. */
export const GEEPAS_BUNDLED_LOGO_UI_SCALE = 1.42;

const SLUG_ALIASES: Record<string, string> = {
  "panasonic-blue": "panasonic",
  "lg-wordmark": "lg",
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
  egida: { src: '/assets/brands/egida.svg', width: 256, height: 256 },
  electrolux: { src: '/assets/brands/electrolux.svg', width: 1367, height: 177 },
  franko: { src: '/assets/brands/franko.svg', width: 520, height: 140 },
  geepas: { src: '/assets/brands/geepas.webp', width: 2000, height: 738 },
  hennson: { src: '/assets/brands/hennson.svg', width: 520, height: 140 },
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

function slugifyLatinToken(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

/**
 * Latin / numeric tokens from display names (e.g. `LG Electronics`, `Samsung Inc.` → lg, samsung).
 */
function latinTokenKeysFromBrandName(name: string): readonly string[] {
  const matches = name.match(/[A-Za-z][A-Za-z0-9.&\s-]{0,40}[A-Za-z0-9]|[A-Za-z]{2,}/g);
  if (!matches) {
    return [];
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const chunk of matches) {
    const compact = slugifyLatinToken(chunk);
    if (compact.length >= 2 && !seen.has(compact)) {
      seen.add(compact);
      out.push(compact);
    }
    for (const word of chunk.split(/[\s/&]+/)) {
      const w = slugifyLatinToken(word);
      if (w.length >= 2 && !seen.has(w)) {
        seen.add(w);
        out.push(w);
      }
    }
  }
  return out;
}

function matchBundledLogoFromName(name: string): BrandStaticLogoDimensions | null {
  const nameKey = name.trim().toLowerCase();
  if (nameKey.length === 0) {
    return null;
  }
  const direct = resolveBrandStaticLogo(nameKey);
  if (direct) {
    return direct;
  }
  for (const token of latinTokenKeysFromBrandName(name)) {
    const hit = resolveBrandStaticLogo(token);
    if (hit) {
      return hit;
    }
  }
  return null;
}

/**
 * Returns a bundled logo asset when the slug matches a known file; otherwise null.
 */
export function resolveBrandStaticLogo(slug: string): BrandStaticLogoDimensions | null {
  const key = slug.trim().toLowerCase();
  const mapped = SLUG_ALIASES[key];
  if (mapped) {
    return SLUG_TO_LOGO[mapped] ?? null;
  }
  return SLUG_TO_LOGO[key] ?? null;
}

export function isGeepasBundledLogoAsset(asset: BrandStaticLogoDimensions): boolean {
  return asset.src.toLowerCase().includes("geepas");
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
  return matchBundledLogoFromName(name);
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
  return matchBundledLogoFromName(name);
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

export type BrandDisplayLogoCellResolved =
  | { readonly mode: 'local'; readonly asset: BrandStaticLogoDimensions }
  | { readonly mode: 'remote'; readonly src: string }
  | { readonly mode: 'wordmark' };

/**
 * Logo for brand cells: bundled artwork first, then remote `logoUrl`; otherwise use a text wordmark.
 */
export function resolveBrandDisplayLogoForCell(
  logoUrl: string | null | undefined,
  slug: string,
  name: string,
): BrandDisplayLogoCellResolved {
  const bundled = resolveBrandStaticLogoForDisplay(slug, name);
  if (bundled) {
    return { mode: 'local', asset: bundled };
  }
  const remote = logoUrl?.trim();
  if (remote) {
    return { mode: 'remote', src: remote };
  }
  return { mode: 'wordmark' };
}
