import { getCachedPdpDetail } from '@/lib/product-pdp/pdp-server-cache';
import type { LanguageCode } from '@/lib/language';

import { ProductPdpQuerySeed } from './ProductPdpQuerySeed';
import type { Product } from './types';

type ProductPdpSSRSeedProps = {
  readonly baseSlug: string;
  readonly serverLanguage: LanguageCode;
};

/**
 * Non-blocking SSR — hydrates React Query detail while the layout PDP shell stays mounted.
 * Related products load client-side (below the fold), so they are not fetched here.
 */
export async function ProductPdpSSRSeed({
  baseSlug,
  serverLanguage,
}: ProductPdpSSRSeedProps) {
  let product: Product | null = null;
  try {
    product = (await getCachedPdpDetail(baseSlug, serverLanguage)) as Product;
  } catch {
    product = null;
  }

  if (!product) {
    return null;
  }

  return <ProductPdpQuerySeed slug={baseSlug} language={serverLanguage} product={product} />;
}
