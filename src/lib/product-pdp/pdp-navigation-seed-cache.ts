import type { QueryClient } from '@tanstack/react-query';

import type { Product } from '@/app/products/[slug]/types';
import { readLanguageCookie, type LanguageCode } from '@/lib/language';
import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';
import { queryKeys } from '@/lib/query-keys';

import {
  buildProductFromPdpNavigationSeed,
  setProductPdpNavigationSeed,
  type ProductPdpNavigationSeed,
} from './pdp-navigation-seed';
import { isPdpListingShell } from './resolve-pdp-listing-shell';

type SeedProductPdpCacheInput = {
  queryClient: QueryClient;
  slug: string;
  language: LanguageCode;
  navigationSeed: ProductPdpNavigationSeed;
};

function mergeSeedIntoExistingDetail(existing: Product, seed: Product): Product {
  return {
    ...existing,
    id: seed.id,
    slug: seed.slug,
    title: seed.title || existing.title,
    media:
      Array.isArray(seed.media) && seed.media.length > 0
        ? seed.media
        : existing.media,
    brand: seed.brand ?? existing.brand,
    categories:
      Array.isArray(seed.categories) && seed.categories.length > 0
        ? seed.categories
        : existing.categories,
    labels:
      Array.isArray(seed.labels) && seed.labels.length > 0
        ? seed.labels
        : existing.labels,
    currentPrice:
      typeof seed.currentPrice === 'number' && Number.isFinite(seed.currentPrice)
        ? seed.currentPrice
        : existing.currentPrice,
    oldPrice:
      typeof seed.oldPrice === 'number'
        ? seed.oldPrice
        : seed.oldPrice === null
          ? null
          : existing.oldPrice,
    discountBadge: seed.discountBadge ?? existing.discountBadge ?? null,
    pricing: {
      currentPrice:
        typeof seed.pricing?.currentPrice === 'number'
          ? seed.pricing.currentPrice
          : existing.pricing?.currentPrice ?? existing.currentPrice ?? null,
      oldPrice:
        typeof seed.pricing?.oldPrice === 'number'
          ? seed.pricing.oldPrice
          : seed.pricing?.oldPrice === null
            ? null
            : existing.pricing?.oldPrice ?? existing.oldPrice ?? null,
      discountBadge:
        seed.pricing?.discountBadge ??
        seed.discountBadge ??
        existing.pricing?.discountBadge ??
        existing.discountBadge ??
        null,
    },
    inStock: seed.inStock ?? existing.inStock,
    stockStatus: seed.stockStatus ?? existing.stockStatus,
    warrantyYears: seed.warrantyYears ?? existing.warrantyYears ?? null,
  };
}

/** Writes PLP card shell into React Query detail key for instant PDP paint. */
export function writeProductPdpQueryCache({
  queryClient,
  slug,
  language,
  navigationSeed,
}: SeedProductPdpCacheInput): void {
  const cacheSlug = normalizePdpSlug(slug);
  const seedProduct = buildProductFromPdpNavigationSeed(navigationSeed);

  queryClient.setQueryData(
    queryKeys.productDetail(cacheSlug, language),
    (existing: Product | undefined) => {
      if (!existing) {
        return seedProduct;
      }
      if (!isPdpListingShell(existing)) {
        return existing;
      }
      return mergeSeedIntoExistingDetail(existing, seedProduct);
    },
  );
}

/**
 * Stores PLP card shell into in-memory handoff + React Query cache for instant PDP paint.
 */
export function seedProductPdpCache({
  queryClient,
  slug,
  language,
  navigationSeed,
}: SeedProductPdpCacheInput): void {
  setProductPdpNavigationSeed(slug, language, navigationSeed);
  writeProductPdpQueryCache({ queryClient, slug, language, navigationSeed });

  const cookieLanguage = readLanguageCookie();
  if (cookieLanguage && cookieLanguage !== language) {
    setProductPdpNavigationSeed(slug, cookieLanguage, navigationSeed);
    writeProductPdpQueryCache({
      queryClient,
      slug,
      language: cookieLanguage,
      navigationSeed,
    });
  }
}
