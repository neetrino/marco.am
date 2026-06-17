import type { QueryClient } from '@tanstack/react-query';

import type { Product } from '@/app/products/[slug]/types';
import { getStoredLanguage, type LanguageCode } from '@/lib/language';
import {
  buildProductFromPdpNavigationSeed,
  peekProductPdpNavigationSeedAnyLanguage,
} from '@/lib/product-pdp/pdp-navigation-seed';
import { shopGridProductToPdpNavigationSeed } from '@/lib/shop-grid-product-pdp-seed';
import { getShopProductBySlug } from '@/lib/shop-products-cache-store';
import { queryKeys } from '@/lib/query-keys';
import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';

function hasFullProductDetails(product: Product): boolean {
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

export function isPdpListingShell(product: Product | null | undefined): boolean {
  return product != null && !hasFullProductDetails(product);
}

function languagesForPdpShellLookup(lang: LanguageCode): LanguageCode[] {
  const stored = typeof window === 'undefined' ? null : getStoredLanguage();
  const candidates: LanguageCode[] = [lang];
  if (stored && stored !== lang) {
    candidates.push(stored);
  }
  return candidates;
}

function readCachedProductDetail(
  slug: string,
  languages: readonly LanguageCode[],
  queryClient: QueryClient,
): Product | undefined {
  for (const language of languages) {
    const cached = queryClient.getQueryData<Product>(queryKeys.productDetail(slug, language));
    if (cached && normalizePdpSlug(cached.slug) === slug) {
      return cached;
    }
  }
  return undefined;
}

/** Resolves PDP shell/full product from React Query PLP cache or slug store. */
export function resolvePdpInitialFromListingCache(
  slug: string,
  lang: LanguageCode,
  queryClient: QueryClient,
): Product | undefined {
  const normalizedSlug = normalizePdpSlug(slug);
  if (!normalizedSlug) {
    return undefined;
  }

  const cached = readCachedProductDetail(normalizedSlug, languagesForPdpShellLookup(lang), queryClient);
  if (cached) {
    return cached;
  }

  const gridProduct = getShopProductBySlug(normalizedSlug);
  if (!gridProduct) {
    return undefined;
  }

  return buildProductFromPdpNavigationSeed(shopGridProductToPdpNavigationSeed(gridProduct));
}

/** Synchronous PLP/card shell for instant PDP paint (img, title, price, brand). */
export function resolvePdpInstantShell(
  slug: string,
  lang: LanguageCode,
  queryClient: QueryClient,
): Product | null {
  const normalizedSlug = normalizePdpSlug(slug);
  if (!normalizedSlug) {
    return null;
  }

  const fromSeed = peekProductPdpNavigationSeedAnyLanguage(normalizedSlug, lang);
  if (fromSeed && normalizePdpSlug(fromSeed.slug) === normalizedSlug) {
    return fromSeed;
  }

  const fromListing = resolvePdpInitialFromListingCache(normalizedSlug, lang, queryClient);
  if (fromListing && normalizePdpSlug(fromListing.slug) === normalizedSlug) {
    return fromListing;
  }

  return null;
}
