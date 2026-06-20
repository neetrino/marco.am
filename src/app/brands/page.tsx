import { unstable_cache } from 'next/cache';

import { homeBrandPartnersService } from '@/lib/services/home-brand-partners.service';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

import { BrandsDirectory } from './BrandsDirectory';

export const revalidate = 3600;

/**
 * Next.js-level ISR cache for the brands page SSR seed.
 * Separate from the Redis read-through cache — this one tells Next.js
 * the result is safe to prerender and serve from the CDN edge cache.
 * Invalidated by `revalidateTag('brands-page')` when admin changes brand partners.
 */
const getBrandsForPage = unstable_cache(
  () => homeBrandPartnersService.getPublicPayload('hy'),
  ['brands-page-hy'],
  { revalidate: 3600, tags: ['brands-page'] },
);

export default async function BrandsPage() {
  let initialBrands: HomeBrandPartnerPublicItem[] = [];
  try {
    const data = await getBrandsForPage();
    initialBrands = data.brands ?? [];
  } catch {
    // Fallback: BrandsDirectory will client-fetch on mount
  }

  return <BrandsDirectory initialBrands={initialBrands} />;
}
