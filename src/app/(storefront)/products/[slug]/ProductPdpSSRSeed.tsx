import {
  getCachedPdpDetail,
  getCachedPdpRelated,
} from '@/lib/product-pdp/pdp-server-cache';
import type { RelatedProductsApiResponse } from '@/lib/product-pdp/fetch-related-products';
import type { LanguageCode } from '@/lib/language';

import { ProductPdpQuerySeed } from './ProductPdpQuerySeed';
import type { Product } from './types';

type ProductPdpSSRSeedProps = {
  readonly baseSlug: string;
  readonly serverLanguage: LanguageCode;
};

async function loadPdpDetail(baseSlug: string, serverLanguage: LanguageCode): Promise<Product | null> {
  try {
    return (await getCachedPdpDetail(baseSlug, serverLanguage)) as Product;
  } catch {
    return null;
  }
}

async function loadPdpRelated(
  baseSlug: string,
  serverLanguage: LanguageCode,
): Promise<RelatedProductsApiResponse | null> {
  try {
    return (await getCachedPdpRelated(baseSlug, serverLanguage)) as RelatedProductsApiResponse;
  } catch {
    return null;
  }
}

/**
 * Non-blocking SSR — hydrates React Query for PDP detail and related carousel in parallel.
 */
export async function ProductPdpSSRSeed({
  baseSlug,
  serverLanguage,
}: ProductPdpSSRSeedProps) {
  const [product, relatedProducts] = await Promise.all([
    loadPdpDetail(baseSlug, serverLanguage),
    loadPdpRelated(baseSlug, serverLanguage),
  ]);

  if (!product) {
    return null;
  }

  return (
    <ProductPdpQuerySeed
      slug={baseSlug}
      language={serverLanguage}
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
