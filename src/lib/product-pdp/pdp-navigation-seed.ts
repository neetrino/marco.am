import type { LanguageCode } from '@/lib/language';
import type { Product } from '@/app/products/[slug]/types';

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
  return `${language}:${slug}`;
}

function toSeedProduct(value: ProductPdpNavigationSeed): Product {
  return {
    id: value.id,
    slug: value.slug,
    title: value.title,
    media: value.image ? [value.image] : [],
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

export function consumeProductPdpNavigationSeed(
  slug: string,
  language: LanguageCode,
): Product | null {
  const key = keyFor(slug, language);
  const item = seedStore.get(key);
  if (!item) {
    return null;
  }
  seedStore.delete(key);
  if (Date.now() - item.createdAt > NAVIGATION_SEED_TTL_MS) {
    return null;
  }
  return toSeedProduct(item.value);
}

export function consumeProductPdpNavigationSeedAnyLanguage(
  slug: string,
  preferredLanguage: LanguageCode,
): Product | null {
  const preferred = consumeProductPdpNavigationSeed(slug, preferredLanguage);
  if (preferred) {
    return preferred;
  }

  const suffix = `:${slug}`;
  for (const [key, item] of seedStore.entries()) {
    if (!key.endsWith(suffix)) {
      continue;
    }
    seedStore.delete(key);
    if (Date.now() - item.createdAt > NAVIGATION_SEED_TTL_MS) {
      return null;
    }
    return toSeedProduct(item.value);
  }

  return null;
}

export function buildProductFromPdpNavigationSeed(
  value: ProductPdpNavigationSeed,
): Product {
  return toSeedProduct(value);
}
