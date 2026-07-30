import { homeBrandPartnersService } from '@/lib/services/home-brand-partners.service';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

import { BrandsDirectory } from './BrandsDirectory';

/** Always render with fresh DB/read-through cache; client also refetches on mount. */
export const dynamic = 'force-dynamic';

export default async function BrandsPage() {
  let initialBrands: HomeBrandPartnerPublicItem[] = [];
  try {
    const data = await homeBrandPartnersService.getPublicPayload('hy');
    initialBrands = data.brands ?? [];
  } catch {
    // BrandsDirectory will client-fetch on mount
  }

  return <BrandsDirectory initialBrands={initialBrands} />;
}
