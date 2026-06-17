import { BrandPlpLink } from '@/components/BrandPlpLink';

import {
  BRANDS_DIRECTORY_CARD_MIN_HEIGHT_PX,
  BRANDS_DIRECTORY_LCP_IMAGE_PRIORITY_COUNT,
} from '@/constants/brands-directory-layout';
import {
  BRANDS_DIRECTORY_CARD_OVERSIZED_MIN_HEIGHT_PX,
  isBrandLogoCellOversizedSlug,
} from '@/lib/brand-logo-cell-oversize';
import type { HomeBrandPartnerPublicItem } from '@/lib/types/home-brand-partners-public';

import { BrandDirectoryLogo } from './BrandDirectoryLogo';

export function BrandsDirectoryGrid({
  brands,
}: {
  readonly brands: readonly HomeBrandPartnerPublicItem[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {brands.map((partner, index) => (
        <BrandPlpLink
          key={partner.id}
          href={partner.href}
          style={{
            minHeight: `${
              isBrandLogoCellOversizedSlug(partner.slug, partner.name)
                ? BRANDS_DIRECTORY_CARD_OVERSIZED_MIN_HEIGHT_PX
                : BRANDS_DIRECTORY_CARD_MIN_HEIGHT_PX
            }px`,
          }}
          className="group flex items-center justify-center rounded-2xl border border-marco-border bg-[#ffffff] px-4 py-5 sm:px-5 sm:py-6 transition-colors hover:border-marco-black/30 hover:bg-[#f8f8f8] dark:bg-[#ffffff] dark:hover:bg-[#f8f8f8]"
          aria-label={partner.name}
        >
          <BrandDirectoryLogo
            partner={partner}
            imagePriority={index < BRANDS_DIRECTORY_LCP_IMAGE_PRIORITY_COUNT}
          />
        </BrandPlpLink>
      ))}
    </div>
  );
}
