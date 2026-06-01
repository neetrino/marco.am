import { cookies } from 'next/headers';

import { ProductPageClient } from './ProductPageClient';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { getCachedPdpDetail, getCachedPdpRelated, getCachedPdpVisual, PDP_RELATED_SSR_LIMIT } from '@/lib/product-pdp/pdp-server-cache';
import type { RelatedProductsApiResponse } from '@/lib/product-pdp/fetch-related-products';

import type { Product } from './types';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { slug: slugParam } = await params;
  const cookieStore = await cookies();
  const serverLanguage: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  const slugParts = slugParam.includes(':') ? slugParam.split(':') : [slugParam];
  const baseSlug = slugParts[0] ?? slugParam;

  let initialVisual = null;
  let initialProduct: Product | null = null;
  let initialRelatedProducts: RelatedProductsApiResponse | null = null;
  const [visualSettled, detailSettled, relatedSettled] = await Promise.allSettled([
    getCachedPdpVisual(baseSlug, serverLanguage),
    getCachedPdpDetail(baseSlug, serverLanguage),
    getCachedPdpRelated(baseSlug, serverLanguage, PDP_RELATED_SSR_LIMIT),
  ]);
  if (visualSettled.status === 'fulfilled') {
    initialVisual = visualSettled.value;
  }
  if (detailSettled.status === 'fulfilled') {
    /* Same payload shape as GET /api/v1/products/[slug] (Prisma transform). */
    initialProduct = detailSettled.value as Product;
  }
  if (relatedSettled.status === 'fulfilled') {
    initialRelatedProducts = relatedSettled.value;
  }

  return (
    <ProductPageClient
      slugParam={slugParam}
      serverLanguage={serverLanguage}
      initialVisual={initialVisual}
      initialProduct={initialProduct}
      initialRelatedProducts={initialRelatedProducts}
    />
  );
}
