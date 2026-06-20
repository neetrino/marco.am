import { cacheService } from "@/lib/services/cache.service";

/** Coalesce concurrent cache misses for the same key (one DB/compute path per key). */
const inflightByKey = new Map<string, Promise<unknown>>();

const PRODUCTS_PLP_LISTING_PATTERN = "cache:products:plp:*";
const PRODUCTS_PLP_FILTERS_PATTERN = "cache:products:filters:*";
const PRODUCTS_PDP_PATTERN = "cache:products:pdp:*";
const PRODUCTS_PDP_DETAIL_PATTERN = "cache:products:detail:*";
const BANNERS_PUBLIC_PATTERN = "banners:public:*";
const REELS_PUBLIC_PATTERN = "reels:public:*";
const CATEGORIES_TREE_PATTERN = "categories:tree:*";
const CATEGORIES_MEGA_MENU_PATTERN = "categories:mega-menu:*";
const CATEGORIES_TOP_PATTERN = "categories:top:*";
const FOOTER_PUBLIC_PATTERN = "footer:public:*";
const WHY_CHOOSE_PUBLIC_PATTERN = "why-choose:public:*";
const HOME_BRAND_PARTNERS_PUBLIC_PATTERN = "home:brand-partners:public:*";

/**
 * Read-through JSON cache (Redis when configured, else in-memory via cacheService.setex).
 */
export async function getCachedJson<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  options?: { requireSharedCache?: boolean },
): Promise<T> {
  if (options?.requireSharedCache) {
    const backend = await cacheService.getBackend();
    if (backend === "memory" && process.env.NODE_ENV === "production") {
      return fetcher();
    }
  }

  const hit = await cacheService.get(key);
  if (hit !== null && hit !== undefined && hit.length > 0) {
    try {
      return JSON.parse(hit) as T;
    } catch {
      // Corrupt entry — recompute
    }
  }

  if (!inflightByKey.has(key)) {
    inflightByKey.set(
      key,
      (async () => {
        try {
          const second = await cacheService.get(key);
          if (second !== null && second !== undefined && second.length > 0) {
            try {
              return JSON.parse(second) as T;
            } catch {
              // fall through to fetcher
            }
          }
          const fresh = await fetcher();
          await cacheService.setex(key, ttlSeconds, JSON.stringify(fresh));
          return fresh;
        } finally {
          inflightByKey.delete(key);
        }
      })(),
    );
  }

  return inflightByKey.get(key) as Promise<T>;
}

/** Clear the storefront PLP listing + facet caches (call after a listing projection rebuild). */
export async function invalidateProductsPlpCache(): Promise<void> {
  await cacheService.deletePattern(PRODUCTS_PLP_LISTING_PATTERN);
  await cacheService.deletePattern(PRODUCTS_PLP_FILTERS_PATTERN);
}

/** Clear PDP SSR + API caches (detail + related) so warmed entries refresh on product change. */
export async function invalidateProductPdpCache(): Promise<void> {
  await cacheService.deletePattern(PRODUCTS_PDP_PATTERN);
  await cacheService.deletePattern(PRODUCTS_PDP_DETAIL_PATTERN);
}

/** Clear every storefront product read cache (PLP + PDP + brand directory) after a product projection change. */
export async function invalidateProductReadCaches(): Promise<void> {
  await invalidateProductsPlpCache();
  await invalidateProductPdpCache();
  // Brand directory membership ("brands with shop-visible products") derives from the
  // product projection, so it must refresh when products change.
  await invalidateHomeBrandPartnersPublicCache();
}

export async function invalidateBannersPublicCache(): Promise<void> {
  await cacheService.deletePattern(BANNERS_PUBLIC_PATTERN);
}

export async function invalidateReelsPublicCache(): Promise<void> {
  await cacheService.deletePattern(REELS_PUBLIC_PATTERN);
}

export async function invalidateCategoryPublicCaches(): Promise<void> {
  await cacheService.deletePattern(CATEGORIES_TREE_PATTERN);
  await cacheService.deletePattern(CATEGORIES_MEGA_MENU_PATTERN);
  await cacheService.deletePattern(CATEGORIES_TOP_PATTERN);
  await cacheService.deletePattern(PRODUCTS_PLP_LISTING_PATTERN);
  await cacheService.deletePattern(PRODUCTS_PLP_FILTERS_PATTERN);
}

export async function invalidateFooterPublicCache(): Promise<void> {
  await cacheService.deletePattern(FOOTER_PUBLIC_PATTERN);
}

export async function invalidateWhyChooseUsPublicCache(): Promise<void> {
  await cacheService.deletePattern(WHY_CHOOSE_PUBLIC_PATTERN);
}

export async function invalidateHomeBrandPartnersPublicCache(): Promise<void> {
  await cacheService.deletePattern(HOME_BRAND_PARTNERS_PUBLIC_PATTERN);
}
