import {
  getCachedPdpDetail,
  getCachedPdpRelated,
  PDP_RELATED_SSR_LIMIT,
} from '@/lib/product-pdp/pdp-server-cache';
import type { LanguageCode } from '@/lib/language';

import { ProductPdpQuerySeed } from './ProductPdpQuerySeed';
import type { Product } from './types';

type ProductPdpSSRSeedProps = {
  readonly baseSlug: string;
  readonly serverLanguage: LanguageCode;
};

/** Non-blocking SSR — hydrates React Query while layout PDP shell stays mounted. */
export async function ProductPdpSSRSeed({
  baseSlug,
  serverLanguage,
}: ProductPdpSSRSeedProps) {
  const [detailSettled, relatedSettled] = await Promise.allSettled([
    getCachedPdpDetail(baseSlug, serverLanguage),
    getCachedPdpRelated(baseSlug, serverLanguage, PDP_RELATED_SSR_LIMIT),
  ]);

  const product =
    detailSettled.status === 'fulfilled' && detailSettled.value != null
      ? (detailSettled.value as Product)
      : null;

  const related =
    relatedSettled.status === 'fulfilled' &&
    relatedSettled.value != null &&
    Array.isArray(relatedSettled.value.data) &&
    relatedSettled.value.data.length > 0
      ? relatedSettled.value
      : null;

  if (!product && !related) {
    return null;
  }

  return (
    <ProductPdpQuerySeed
      slug={baseSlug}
      language={serverLanguage}
      product={product}
      related={related}
    />
  );
}
