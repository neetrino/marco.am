import { HERO_MOBILE_PRIMARY_IMAGE_SRC } from '@/components/hero.constants';
import { resolveHeroMobileImageUrl } from '@/lib/utils/resolve-hero-mobile-image-url';
import type { PublicBannersPayload } from '@/lib/services/banner-management.service';

function sortBannerItems<T extends { sortOrder: number; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

/**
 * Mobile hero carousel URLs: dedicated `home.hero.mobile` slides, else legacy
 * `primary[0].imageMobileUrl`, else the default raster.
 */
export function buildHeroMobileImageUrls(
  mobile: PublicBannersPayload | null | undefined,
  primary: PublicBannersPayload,
): string[] {
  const mobileItems = sortBannerItems(mobile?.items ?? []);
  const fromMobileSlot = mobileItems
    .map((item) => item.imageMobileUrl ?? item.imageDesktopUrl)
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    .map((url) => resolveHeroMobileImageUrl(url));

  if (fromMobileSlot.length > 0) {
    return fromMobileSlot;
  }

  const primaryItems = sortBannerItems(primary.items);
  return [resolveHeroMobileImageUrl(primaryItems[0]?.imageMobileUrl ?? HERO_MOBILE_PRIMARY_IMAGE_SRC)];
}
