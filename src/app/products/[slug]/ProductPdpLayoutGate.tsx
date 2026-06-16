import { notFound } from 'next/navigation';

import type { LanguageCode } from '@/lib/language';
import { getCachedPdpExists } from '@/lib/product-pdp/pdp-server-cache';
import { fetchPdpLayoutVisual } from '@/lib/product-pdp/pdp-layout-server';

import { ProductPdpVisualCacheSeed } from './ProductPdpVisualCacheSeed';

type ProductPdpLayoutGateProps = {
  readonly slugParam: string;
  readonly baseSlug: string;
  readonly serverLanguage: LanguageCode;
};

/**
 * Streamed (non-blocking) PDP gate: validates existence for `notFound()` and seeds
 * the SSR gallery visual. Kept out of the layout's render path so a PLP → PDP click
 * paints the instant card shell immediately instead of waiting on these awaits.
 */
export async function ProductPdpLayoutGate({
  slugParam,
  baseSlug,
  serverLanguage,
}: ProductPdpLayoutGateProps) {
  const exists = await getCachedPdpExists(baseSlug);
  if (!exists) {
    notFound();
  }

  const initialVisual = await fetchPdpLayoutVisual(slugParam, serverLanguage);
  if (!initialVisual) {
    return null;
  }

  return (
    <ProductPdpVisualCacheSeed
      slug={baseSlug}
      language={serverLanguage}
      visual={initialVisual}
    />
  );
}
