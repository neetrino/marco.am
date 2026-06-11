/**
 * Local logos under `public/assets/brands/` keyed by published brand `slug`.
 * Used when `Brand.logoUrl` is empty so the home rail still shows real artwork.
 */
export type BrandStaticLogoDimensions = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

function normalizeBrandLookupKey(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

/** `geepas.webp` has wide transparent margins — scale artwork inside the logo cell for clearer mark. */
export const GEEPAS_BUNDLED_LOGO_UI_SCALE = 1.42;

const SLUG_ALIASES: Record<string, string> = {
  'adler-europe': 'adler',
  'aux-air-conditioner': 'aux',
  'baki-sedef-kulp': 'sedef',
  byspan: 'by-span',
  'disa-kulp': 'disa',
  'fgv-formenti-giovenzana': 'fgv',
  'lg-wordmark': 'lg',
  lex: 'lex-life-expert',
  'mf-furniture-hardware': 'mf',
  nnobel: 'nobel',
  'panasonic-blue': 'panasonic',
  'targen-your-kitchen': 'tragen-your-kitchen',
  kumitel: 'kumtel',
};

const SLUG_TO_LOGO: Record<string, BrandStaticLogoDimensions> = {
  adler: { src: '/assets/brands/adler-europe.png', width: 1024, height: 1024 },
  aeg: { src: '/assets/brands/aeg.png', width: 1024, height: 1024 },
  agt: { src: '/assets/brands/agt.png', width: 1024, height: 1024 },
  atias: { src: '/assets/brands/atias.png', width: 1024, height: 1024 },
  aux: { src: '/assets/brands/aux-air-conditioner.png', width: 1024, height: 1024 },
  berg: { src: '/assets/brands/berg.png', width: 1024, height: 1024 },
  blum: { src: '/assets/brands/blum.png', width: 1024, height: 1024 },
  bosch: { src: '/assets/brands/bosch.png', width: 1024, height: 1024 },
  boyut: { src: '/assets/brands/boyut-plastic.png', width: 1024, height: 1024 },
  braun: { src: '/assets/brands/braun.png', width: 1024, height: 1024 },
  'by-span': { src: '/assets/brands/by-span.png', width: 1024, height: 1024 },
  candy: { src: '/assets/brands/candy.png', width: 1024, height: 1024 },
  carino: { src: '/assets/brands/carino.png', width: 1024, height: 1024 },
  centek: { src: '/assets/brands/centek.png', width: 1024, height: 1024 },
  delonghi: { src: '/assets/brands/delonghi.png', width: 1024, height: 1024 },
  disa: { src: '/assets/brands/disa-kulp.png', width: 1024, height: 1024 },
  divaki: { src: '/assets/brands/divaki-japan.png', width: 1024, height: 1024 },
  egger: { src: '/assets/brands/egger.png', width: 1024, height: 1024 },
  egida: { src: '/assets/brands/egida.png', width: 1024, height: 1024 },
  electrolux: { src: '/assets/brands/electrolux.png', width: 1024, height: 1024 },
  eurostek: { src: '/assets/brands/eurostek.png', width: 1024, height: 1024 },
  'evo-gloss': { src: '/assets/brands/evo-gloss.png', width: 1024, height: 1024 },
  fds: { src: '/assets/brands/fds-group.png', width: 1024, height: 1024 },
  fgv: { src: '/assets/brands/fgv-formenti-giovenzana.png', width: 1024, height: 1024 },
  franko: { src: '/assets/brands/franko.png', width: 1024, height: 1024 },
  galanz: { src: '/assets/brands/galanz.png', width: 1024, height: 1024 },
  geepas: { src: '/assets/brands/geepas.png', width: 1024, height: 1024 },
  gentas: { src: '/assets/brands/gentas.png', width: 1024, height: 1024 },
  gorenje: { src: '/assets/brands/gorenje.png', width: 1024, height: 1024 },
  hausberg: { src: '/assets/brands/hausberg.png', width: 1024, height: 1024 },
  hennson: { src: '/assets/brands/hennson.png', width: 1024, height: 1024 },
  hisense: { src: '/assets/brands/hisense.png', width: 1024, height: 1024 },
  hitachi: { src: '/assets/brands/hitachi.png', width: 1024, height: 1024 },
  kastamonu: { src: '/assets/brands/kastamonu.png', width: 1024, height: 1024 },
  kelon: { src: '/assets/brands/kelon.png', width: 1024, height: 1024 },
  kenwood: { src: '/assets/brands/kenwood.png', width: 1024, height: 1024 },
  kronospan: { src: '/assets/brands/kronospan.png', width: 1024, height: 1024 },
  kumtel: { src: '/assets/brands/kumtel.png', width: 1024, height: 1024 },
  lemark: { src: '/assets/brands/lemark.png', width: 1024, height: 1024 },
  'lex-life-expert': { src: '/assets/brands/lex-life-expert.png', width: 1024, height: 1024 },
  lg: { src: '/assets/brands/lg.png', width: 1024, height: 1024 },
  luxell: { src: '/assets/brands/luxell.png', width: 1024, height: 1024 },
  makss: { src: '/assets/brands/makss.png', width: 1024, height: 1024 },
  marrbaxx: { src: '/assets/brands/marrbaxx.png', width: 1024, height: 1024 },
  metali: { src: '/assets/brands/metali.png', width: 1024, height: 1024 },
  mf: { src: '/assets/brands/mf-furniture-hardware.png', width: 1024, height: 1024 },
  midea: { src: '/assets/brands/midea.png', width: 1024, height: 1024 },
  misline: { src: '/assets/brands/misline.png', width: 1024, height: 1024 },
  nobel: { src: '/assets/brands/nobel.png', width: 1024, height: 1024 },
  ozdemir: { src: '/assets/brands/ozdemir.png', width: 1024, height: 1024 },
  panasonic: { src: '/assets/brands/panasonic.png', width: 1024, height: 1024 },
  philips: { src: '/assets/brands/philips.png', width: 1024, height: 1024 },
  pinskdrev: { src: '/assets/brands/pinskdrev.png', width: 1024, height: 1024 },
  puricelli: { src: '/assets/brands/puricelli.png', width: 1024, height: 1024 },
  royax: { src: '/assets/brands/royax-furniture-accessories.png', width: 1024, height: 1024 },
  samsung: { src: '/assets/brands/samsung.png', width: 1024, height: 1024 },
  sedef: { src: '/assets/brands/baki-sedef-kulp.png', width: 1024, height: 1024 },
  simfer: { src: '/assets/brands/simfer.png', width: 1024, height: 1024 },
  skyworth: { src: '/assets/brands/skyworth.png', width: 1024, height: 1024 },
  sony: { src: '/assets/brands/sony.png', width: 1024, height: 1024 },
  starax: { src: '/assets/brands/starax.png', width: 1024, height: 1024 },
  tefal: { src: '/assets/brands/tefal.png', width: 1024, height: 1024 },
  toshiba: { src: '/assets/brands/toshiba.png', width: 1024, height: 1024 },
  'tragen-your-kitchen': {
    src: '/assets/brands/tragen-your-kitchen.png',
    width: 1024,
    height: 1024,
  },
  ultradecor: { src: '/assets/brands/ultradecor.png', width: 1024, height: 1024 },
  unihopper: { src: '/assets/brands/unihopper.png', width: 1024, height: 1024 },
  uz: { src: '/assets/brands/uz.png', width: 1024, height: 1024 },
  vestel: { src: '/assets/brands/vestel.png', width: 1024, height: 1024 },
  wellux: { src: '/assets/brands/wellux.png', width: 1024, height: 1024 },
  xiaomi: { src: '/assets/brands/xiaomi.png', width: 1024, height: 1024 },
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
  const nameKey = normalizeBrandLookupKey(name);
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
  const key = normalizeBrandLookupKey(slug);
  if (key.length === 0) {
    return null;
  }
  const mapped = SLUG_ALIASES[key];
  if (mapped) {
    return SLUG_TO_LOGO[mapped] ?? null;
  }
  return SLUG_TO_LOGO[key] ?? null;
}

export function isGeepasBundledLogoAsset(asset: BrandStaticLogoDimensions): boolean {
  return asset.src.toLowerCase().includes("geepas");
}

/** Per-brand UI scale so bundled artwork reads at similar visual weight on product cards. */
export function resolveProductCardBrandLogoUiScale(
  slug: string,
  name: string,
  src: string,
): number {
  const slugKey = normalizeBrandLookupKey(slug);
  const nameKey = normalizeBrandLookupKey(name);

  if (
    isGeepasBundledLogoAsset({ src, width: 0, height: 0 }) ||
    slugKey === "geepas" ||
    nameKey === "geepas"
  ) {
    return GEEPAS_BUNDLED_LOGO_UI_SCALE;
  }

  return 1;
}

/**
 * Product cards: match `slug` first, then treat normalized `name` as a slug key
 * (e.g. import slug `import-abc12` + name `LG` → `/assets/brands/lg.png`).
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
 * Logo for brand cells: prefer explicit `logoUrl` (typically R2), then bundled artwork; otherwise wordmark.
 */
export function resolveBrandDisplayLogoForCell(
  logoUrl: string | null | undefined,
  slug: string,
  name: string,
): BrandDisplayLogoCellResolved {
  const remote = logoUrl?.trim();
  if (remote) {
    return { mode: 'remote', src: remote };
  }
  const bundled = resolveBrandStaticLogoForDisplay(slug, name);
  if (bundled) {
    return { mode: 'local', asset: bundled };
  }
  return { mode: 'wordmark' };
}
