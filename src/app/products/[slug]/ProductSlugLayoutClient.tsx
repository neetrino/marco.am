'use client';

import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';
import type { LanguageCode } from '@/lib/language';

import { ProductPageClient } from './ProductPageClient';

type ProductSlugLayoutClientProps = {
  slugParam: string;
  serverLanguage: LanguageCode;
  initialVisual: PdpVisualPayload | null;
};

/**
 * Persistent PDP shell — survives page slot streaming so PLP → PDP never remounts the gallery column.
 */
export function ProductSlugLayoutClient({
  slugParam,
  serverLanguage,
  initialVisual,
}: ProductSlugLayoutClientProps) {
  return (
    <ProductPageClient
      slugParam={slugParam}
      serverLanguage={serverLanguage}
      initialVisual={initialVisual}
      initialProduct={null}
      initialRelatedProducts={null}
    />
  );
}
