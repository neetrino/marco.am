import {
  getCachedPdpDetail,
  getCachedPdpRelated,
  PDP_RELATED_SSR_LIMIT,
} from '@/lib/product-pdp/pdp-server-cache';
import type { LanguageCode } from '@/lib/language';

import { ProductPdpDetailCacheSeed } from './ProductPdpDetailCacheSeed';
import { ProductPdpRelatedCacheSeed } from './ProductPdpRelatedCacheSeed';
import type { Product } from './types';

type ProductPdpDetailStreamProps = {
  readonly baseSlug: string;
  readonly serverLanguage: LanguageCode;
};

/** Heavy PDP detail — streamed after gallery shell; hydrates React Query on the client. */
export async function ProductPdpDetailStream({
  baseSlug,
  serverLanguage,
}: ProductPdpDetailStreamProps) {
  const [detailSettled, relatedSettled] = await Promise.allSettled([
    getCachedPdpDetail(baseSlug, serverLanguage),
    getCachedPdpRelated(baseSlug, serverLanguage, PDP_RELATED_SSR_LIMIT),
  ]);

  const detailResult = detailSettled;
  const relatedResult = relatedSettled;

  const detailProduct =
    detailResult.status === 'fulfilled' && detailResult.value != null
      ? (detailResult.value as Product)
      : null;
  const relatedPayload =
    relatedResult.status === 'fulfilled' &&
    relatedResult.value != null &&
    Array.isArray(relatedResult.value.data) &&
    relatedResult.value.data.length > 0
      ? relatedResult.value
      : null;

  if (!detailProduct && !relatedPayload) {
    return null;
  }

  return (
    <>
      {detailProduct ? (
        <ProductPdpDetailCacheSeed
          slug={baseSlug}
          language={serverLanguage}
          product={detailProduct}
        />
      ) : null}
      {relatedPayload ? (
        <ProductPdpRelatedCacheSeed
          slug={baseSlug}
          language={serverLanguage}
          related={relatedPayload}
        />
      ) : null}
    </>
  );
}
