import { HERO_MOBILE_PRIMARY_IMAGE_SRC } from '@/components/hero.constants';

/** Admin / JSON may still reference pre–Figma `1114:3373` mobile hero rasters. */
const LEGACY_HERO_MOBILE_IMAGE_URLS = new Set<string>([
  '/assets/hero/hero-yellow-brick-wall.png',
  '/assets/hero/hero-mobile-brick-wall-314-2380.jpg',
]);

export function resolveHeroMobileImageUrl(
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
