import type { LanguageCode } from '@/lib/language';
import type { Product } from '@/app/products/[slug]/types';
import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';

type ProductCategorySeed = {
  id: string;
  slug: string;
  title: string;
};

type ProductBrandSeed = {
  id: string;
  name: string;
  logo?: string | null;
};

export type ProductPdpNavigationSeed = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  /** Full PLP gallery — same order as PDP canonical gallery. */
  images?: string[];
  brand: ProductBrandSeed | null;
  categories?: ProductCategorySeed[];
  labels?: Product["labels"];
  warrantyYears?: Product["warrantyYears"];
  inStock?: boolean;
  price: number;
  oldPrice?: number | null;
  discountBadge?: Product["discountBadge"];
};

const NAVIGATION_SEED_TTL_MS = 60_000;

const seedStore = new Map<
  string,
  { value: ProductPdpNavigationSeed; createdAt: number }
>();

function keyFor(slug: string, language: LanguageCode): string {
  return `${language}:${normalizePdpSlug(slug)}`;
}

/** Canonical gallery URLs for PLP → PDP handoff. */
export function resolveNavigationSeedImages(
  image: string | null,
  images?: string[],
): string[] {
  if (Array.isArray(images) && images.length > 0) {
    return images.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }
  return image ? [image] : [];
}

function seedMedia(value: ProductPdpNavigationSeed): string[] {
  return resolveNavigationSeedImages(value.image, value.images);
}

function toSeedProduct(value: ProductPdpNavigationSeed): Product {
  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    media: seedMedia(value),
    variants: [],
    brand: value.brand ?? undefined,
    categories: value.categories,
    labels: value.labels ?? [],
    currentPrice: value.price,
    oldPrice: value.oldPrice ?? null,
    inStock: value.inStock,
    stockStatus:
      value.inStock == null ? undefined : value.inStock ? 'in_stock' : 'out_of_stock',
    warrantyYears: value.warrantyYears ?? null,
    pricing: {
      currentPrice: value.price,
      oldPrice: value.oldPrice ?? null,
      discountBadge: value.discountBadge ?? null,
    },
    discountBadge: value.discountBadge ?? null,
  };
}

export function setProductPdpNavigationSeed(
  slug: string,
  language: LanguageCode,
  value: ProductPdpNavigationSeed,
): void {
  seedStore.set(keyFor(slug, language), { value, createdAt: Date.now() });
}

function readNavigationSeedEntry(
  key: string,
  remove: boolean,
): ProductPdpNavigationSeed | null {
  const item = seedStore.get(key);
  if (!item) {
    return null;
  }
  if (Date.now() - item.createdAt > NAVIGATION_SEED_TTL_MS) {
    if (remove) {
      seedStore.delete(key);
    }
    return null;
  }
  if (remove) {
    seedStore.delete(key);
  }
  return item.value;
}

function peekNavigationSeedAnyLanguage(
  slug: string,
  preferredLanguage: LanguageCode,
): ProductPdpNavigationSeed | null {
  const preferred = readNavigationSeedEntry(keyFor(slug, preferredLanguage), false);
  if (preferred) {
    return preferred;
  }

  const suffix = `:${normalizePdpSlug(slug)}`;
  for (const [key, item] of seedStore.entries()) {
    if (!key.endsWith(suffix)) {
      continue;
    }
    if (Date.now() - item.createdAt > NAVIGATION_SEED_TTL_MS) {
      continue;
    }
    return item.value;
  }

  return null;
}

/** Non-destructive read — safe under React Strict Mode double mount. */
export function peekProductPdpNavigationSeedAnyLanguage(
  slug: string,
  preferredLanguage: LanguageCode,
): Product | null {
  const seed = peekNavigationSeedAnyLanguage(slug, preferredLanguage);
  return seed ? toSeedProduct(seed) : null;
}

export function clearProductPdpNavigationSeedAnyLanguage(slug: string): void {
  const suffix = `:${normalizePdpSlug(slug)}`;
  for (const key of seedStore.keys()) {
    if (key.endsWith(suffix)) {
      seedStore.delete(key);
    }
  }
}


export function buildProductFromPdpNavigationSeed(
  value: ProductPdpNavigationSeed,
): Product {
  return toSeedProduct(value);
}
