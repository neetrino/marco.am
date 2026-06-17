/** Settings key for admin-managed banners (slots/scheduling/links). */
export const BANNER_MANAGEMENT_SETTINGS_KEY = "banners" as const;

/** Stored payload version for future shape migrations. */
export const BANNER_MANAGEMENT_VERSION = 1 as const;

/** Supported banner slots for storefront placements. */
export const BANNER_SLOT_IDS = [
  "home.hero.primary",
  "home.hero.secondary",
  "home.promo.strip",
  "home.app.banner",
  "catalog.top",
  "catalog.sidebar",
] as const;

export type BannerSlotId = (typeof BANNER_SLOT_IDS)[number];
