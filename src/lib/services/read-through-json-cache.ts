import { cacheService } from "@/lib/services/cache.service";

/** Coalesce concurrent cache misses for the same key (one DB/compute path per key). */
const inflightByKey = new Map<string, Promise<unknown>>();

const BANNERS_PUBLIC_PATTERN = "banners:public:*";
const REELS_PUBLIC_PATTERN = "reels:public:*";
const CATEGORIES_TREE_PATTERN = "categories:tree:*";
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
    if (backend === "memory") {
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

export async function invalidateBannersPublicCache(): Promise<void> {
  await cacheService.deletePattern(BANNERS_PUBLIC_PATTERN);
}

export async function invalidateReelsPublicCache(): Promise<void> {
  await cacheService.deletePattern(REELS_PUBLIC_PATTERN);
}

export async function invalidateCategoryPublicCaches(): Promise<void> {
  await cacheService.deletePattern(CATEGORIES_TREE_PATTERN);
  await cacheService.deletePattern(CATEGORIES_TOP_PATTERN);
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
