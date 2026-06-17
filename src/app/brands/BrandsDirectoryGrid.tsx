import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

import { BrandsDirectoryGridClient } from './BrandsDirectoryGridClient';

export function BrandsDirectoryGrid({
  brands,
}: {
  readonly brands: readonly HomeBrandPartnerPublicItem[];
}) {
  return <BrandsDirectoryGridClient brands={brands} />;
}
