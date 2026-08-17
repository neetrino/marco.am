/** Max slides in the mobile home hero carousel (admin + storefront). */
export const HOME_HERO_MOBILE_SLIDES_MAX = 8;

/** Auto-advance interval for the mobile hero carousel. */
export const HOME_HERO_MOBILE_AUTO_ROTATE_MS = 4000;

/** Stable id prefix for `home.hero.mobile` banner items. */
export const HOME_HERO_MOBILE_SLIDE_ID_PREFIX = "home-hero-mobile-slide-" as const;

export function buildHomeHeroMobileSlideId(index: number): string {
  return `${HOME_HERO_MOBILE_SLIDE_ID_PREFIX}${index}`;
}
