import {
  HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL,
  HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL,
  HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL,
} from '@/lib/constants/home-hero-admin-banners';
import type { PublicBannersPayload } from '@/lib/services/banner-management.service';
import { resolveHeroMobileImageUrl } from '@/lib/utils/resolve-hero-mobile-image-url';

export type HeroCarouselImageUrls = {
  leftTop: string;
  leftBottom: string;
  right: string;
  mobile: string;
};

function sortBannerItems<T extends { sortOrder: number; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

/**
 * Resolves hero raster URLs from public banner payloads (same ordering as legacy client fetch).
 */
export function buildHeroCarouselImageUrls(
  primary: PublicBannersPayload,
  secondary: PublicBannersPayload,
): HeroCarouselImageUrls {
  const primaryItems = sortBannerItems(primary.items);
  const secondaryItems = sortBannerItems(secondary.items);

  return {
    leftTop: primaryItems[0]?.imageDesktopUrl ?? HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL,
    leftBottom: primaryItems[1]?.imageDesktopUrl ?? HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL,
    right: secondaryItems[0]?.imageDesktopUrl ?? HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL,
    mobile: resolveHeroMobileImageUrl(primaryItems[0]?.imageMobileUrl),
  };
}
