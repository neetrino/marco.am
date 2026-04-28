import {
  HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL,
  HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL,
  HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL,
} from '@/lib/constants/home-hero-admin-banners';
import type { PublicBannersPayload } from '@/lib/services/banner-management.service';
import { HERO_MOBILE_PRIMARY_IMAGE_SRC } from '@/components/hero.constants';

/** Persisted admin URLs from older MARCO mobile hero — map to current default raster. */
const LEGACY_HERO_MOBILE_IMAGE_URLS = new Set<string>([
  '/assets/hero/hero-yellow-brick-wall.png',
  '/assets/hero/hero-mobile-brick-wall-314-2380.jpg',
]);

function resolveHeroCarouselMobileUrl(
  imageMobileUrl: string | null | undefined,
): string {
  if (imageMobileUrl == null || imageMobileUrl.trim() === '') {
    return HERO_MOBILE_PRIMARY_IMAGE_SRC;
  }
  const trimmed = imageMobileUrl.trim();
  if (LEGACY_HERO_MOBILE_IMAGE_URLS.has(trimmed)) {
    return HERO_MOBILE_PRIMARY_IMAGE_SRC;
  }
  return trimmed;
}

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
    mobile: resolveHeroCarouselMobileUrl(primaryItems[0]?.imageMobileUrl),
  };
}
