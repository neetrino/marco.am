import { Suspense } from 'react';
import { cookies } from 'next/headers';

import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';
import { RELATED_PRODUCTS_FETCH_LIMIT } from '@/lib/product-pdp/related-products.constants';
import { getCachedPdpRelated, getCachedPdpVisual } from '@/lib/product-pdp/pdp-server-cache';
import type { RelatedProductsApiResponse } from '@/lib/product-pdp/fetch-related-products';

import { ProductPageClient } from './ProductPageClient';
import { ProductPdpDetailStream } from './ProductPdpDetailStream';

type PageProps = {
  params: Promise<{ slug: string }>;
};

function baseSlugFromParam(slugParam: string): string {
  const slugParts = slugParam.includes(':') ? slugParam.split(':') : [slugParam];
  return slugParts[0] ?? slugParam;
}

/**
 * PDP — visual + related SSR for first paint; detail streams in a second chunk.
 */
export default async function ProductPage({ params }: PageProps) {
  const { slug: slugParam } = await params;
  const cookieStore = await cookies();
  const serverLanguage: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  const baseSlug = baseSlugFromParam(slugParam);

  const [visualOutcome, relatedOutcome] = await Promise.allSettled([
    getCachedPdpVisual(baseSlug, serverLanguage),
    getCachedPdpRelated(baseSlug, serverLanguage, RELATED_PRODUCTS_FETCH_LIMIT),
  ]);

  const initialVisual = visualOutcome.status === 'fulfilled' ? visualOutcome.value : null;
  const initialRelatedProducts: RelatedProductsApiResponse | null =
    relatedOutcome.status === 'fulfilled' ? relatedOutcome.value : null;

  return (
    <>
      <ProductPageClient
        slugParam={slugParam}
        serverLanguage={serverLanguage}
        initialVisual={initialVisual}
        initialProduct={null}
        initialRelatedProducts={initialRelatedProducts}
      />
      <Suspense fallback={null}>
        <ProductPdpDetailStream baseSlug={baseSlug} serverLanguage={serverLanguage} />
      </Suspense>
    </>
  );
}
