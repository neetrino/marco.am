import type { QueryClient } from '@tanstack/react-query';

import type { Product } from '@/app/products/[slug]/types';
import { readLanguageCookie, type LanguageCode } from '@/lib/language';
import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';
import { queryKeys } from '@/lib/query-keys';
import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';

import {
  buildProductFromPdpNavigationSeed,
  setProductPdpNavigationSeed,
  type ProductPdpNavigationSeed,
} from './pdp-navigation-seed';

type SeedProductPdpCacheInput = {
  queryClient: QueryClient;
  slug: string;
  language: LanguageCode;
  navigationSeed: ProductPdpNavigationSeed;
};

function hasFullProductDetails(product: Product | undefined): boolean {
  if (!product) {
    return false;
  }
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return true;
  }
  if (Array.isArray(product.description) && product.description.length > 0) {
    return true;
  }
  if (Array.isArray(product.productAttributes) && product.productAttributes.length > 0) {
    return true;
  }
  return false;
}

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

function hasRichVisualPayload(visual: PdpVisualPayload | undefined): boolean {
  if (!visual) {
    return false;
  }
  if (Array.isArray(visual.gallery) && visual.gallery.length > 0) {
    return true;
  }
  return Array.isArray(visual.images) && visual.images.length > 1;
}

function buildSeedVisualPayload(seedProduct: Product): PdpVisualPayload {
  return {
    id: seedProduct.id,
    slug: seedProduct.slug,
    title: seedProduct.title,
    images: Array.isArray(seedProduct.media)
      ? seedProduct.media.filter((item): item is string => typeof item === 'string')
      : [],
    gallery: [],
    labels: seedProduct.labels ?? [],
    discountPercent:
      seedProduct.discountBadge?.type === 'percentage'
        ? seedProduct.discountBadge.value
        : null,
  };
}

function mergeSeedIntoExistingVisual(
  existing: PdpVisualPayload,
  seedVisual: PdpVisualPayload,
): PdpVisualPayload {
  return {
    ...existing,
    id: seedVisual.id,
    slug: seedVisual.slug,
    title: seedVisual.title || existing.title,
    images: seedVisual.images.length > 0 ? seedVisual.images : existing.images,
    labels: seedVisual.labels.length > 0 ? seedVisual.labels : existing.labels,
    discountPercent:
      seedVisual.discountPercent != null
        ? seedVisual.discountPercent
        : existing.discountPercent,
  };
}

/** Writes PLP card summary into React Query PDP keys (no navigation handoff map). */
export function writeProductPdpQueryCache({
  queryClient,
  slug,
  language,
  navigationSeed,
}: SeedProductPdpCacheInput): void {
  const cacheSlug = normalizePdpSlug(slug);
  const seedProduct = buildProductFromPdpNavigationSeed(navigationSeed);
  const seedVisual = buildSeedVisualPayload(seedProduct);

  queryClient.setQueryData(
    queryKeys.productDetail(cacheSlug, language),
    (existing: Product | undefined) => {
      if (!existing) {
        return seedProduct;
      }
      if (hasFullProductDetails(existing)) {
        return existing;
      }
      return mergeSeedIntoExistingDetail(existing, seedProduct);
    },
  );

  queryClient.setQueryData(
    queryKeys.productVisual(cacheSlug, language),
    (existing: PdpVisualPayload | undefined) => {
      if (!existing) {
        return seedVisual;
      }
      if (hasRichVisualPayload(existing)) {
        return existing;
      }
      return mergeSeedIntoExistingVisual(existing, seedVisual);
    },
  );
}

/**
 * Stores PLP card summary into in-memory handoff + React Query cache for instant PDP paint.
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
