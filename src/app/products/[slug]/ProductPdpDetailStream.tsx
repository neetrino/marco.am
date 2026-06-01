import { getCachedPdpDetail } from '@/lib/product-pdp/pdp-server-cache';
import type { LanguageCode } from '@/lib/language';

import { ProductPdpDetailCacheSeed } from './ProductPdpDetailCacheSeed';
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
  const detailSettled = await Promise.allSettled([
    getCachedPdpDetail(baseSlug, serverLanguage),
  ]);

  const result = detailSettled[0];
  if (!result || result.status !== 'fulfilled' || result.value == null) {
    return null;
  }

  return (
    <ProductPdpDetailCacheSeed
      slug={baseSlug}
      language={serverLanguage}
      product={result.value as Product}
    />
  );
}
