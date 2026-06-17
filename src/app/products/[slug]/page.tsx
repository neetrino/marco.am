import { cookies } from 'next/headers';

import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';
import {
  getCachedPdpDetail,
  getCachedPdpRelated,
  PDP_RELATED_SSR_LIMIT,
} from '@/lib/product-pdp/pdp-server-cache';
import type { RelatedProductsApiResponse } from '@/lib/product-pdp/fetch-related-products';

import { ProductPageClient } from './ProductPageClient';
import type { Product } from './types';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * PDP page — SSR full product + related for first paint; PLP navigation still uses card shell.
 */
export default async function ProductPage({ params }: PageProps) {
  const { slug: slugParam } = await params;
  const cookieStore = await cookies();
  const serverLanguage: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  const baseSlug = normalizePdpSlug(slugParam);

  const [detailSettled, relatedSettled] = await Promise.allSettled([
    getCachedPdpDetail(baseSlug, serverLanguage),
    getCachedPdpRelated(baseSlug, serverLanguage, PDP_RELATED_SSR_LIMIT),
  ]);

  const initialProduct =
    detailSettled.status === 'fulfilled' && detailSettled.value != null
      ? (detailSettled.value as Product)
      : null;

  const initialRelatedProducts: RelatedProductsApiResponse | null =
    relatedSettled.status === 'fulfilled' &&
    relatedSettled.value != null &&
    Array.isArray(relatedSettled.value.data) &&
    relatedSettled.value.data.length > 0
      ? relatedSettled.value
      : null;

  return (
    <ProductPageClient
      slugParam={slugParam}
      serverLanguage={serverLanguage}
      initialProduct={initialProduct}
      initialRelatedProducts={initialRelatedProducts}
    />
  );
}
