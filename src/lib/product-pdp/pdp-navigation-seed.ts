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

  return {
    id: item.value.id,
    slug: item.value.slug,
    title: item.value.title,
    media: item.value.image ? [item.value.image] : [],
    variants: [],
    brand: item.value.brand ?? undefined,
    categories: item.value.categories,
    currentPrice: item.value.price,
    oldPrice: item.value.oldPrice ?? null,
    pricing: {
      currentPrice: item.value.price,
      oldPrice: item.value.oldPrice ?? null,
      discountBadge: item.value.discountBadge ?? null,
    },
    discountBadge: item.value.discountBadge ?? null,
  };
}
