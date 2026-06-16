'use client';

import { useLayoutEffect } from 'react';

import type { LanguageCode } from '@/lib/language';
import type { PdpVisualPayload } from '@/lib/services/products-slug/product-transformer';
import { queryKeys } from '@/lib/query-keys';
import { getQueryClient } from '@/lib/query/get-query-client';

type ProductPdpVisualCacheSeedProps = {
  readonly slug: string;
  readonly language: LanguageCode;
  readonly visual: PdpVisualPayload;
};

/**
 * Streams the SSR gallery visual into React Query so a cold direct load paints the
 * gallery without blocking the layout shell on navigation.
 */
export function ProductPdpVisualCacheSeed({
  slug,
  language,
  visual,
}: ProductPdpVisualCacheSeedProps) {
  useLayoutEffect(() => {
    const queryClient = getQueryClient();
    const key = queryKeys.productVisual(slug, language);
    if (queryClient.getQueryData(key) === undefined) {
      queryClient.setQueryData(key, visual);
    }
  }, [slug, language, visual]);

  return null;
}
