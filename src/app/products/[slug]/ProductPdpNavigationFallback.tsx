'use client';

import { useParams } from 'next/navigation';

import { normalizePdpSlug } from '@/lib/product-pdp/pdp-slug';
import { resolvePdpInstantShell } from '@/lib/product-pdp/resolve-pdp-listing-shell';
import { getStoredLanguage } from '@/lib/language';
import { getQueryClient } from '@/lib/query/get-query-client';

import { ProductPdpShellPaint } from './ProductPdpShellPaint';

/** Next.js `loading.tsx` fallback — paints card/PLP shell while RSC stream completes. */
export function ProductPdpNavigationFallback() {
  const params = useParams();
  const slugParam = typeof params?.slug === 'string' ? params.slug : '';
  const slug = normalizePdpSlug(slugParam);
  const shell = slug
    ? resolvePdpInstantShell(slug, getStoredLanguage(), getQueryClient())
    : null;

  return <ProductPdpShellPaint shell={shell} />;
}
