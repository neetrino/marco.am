import { apiClient } from '@/lib/api-client';
import {
  ADMIN_CACHE_KEYS,
  buildAdminCategoriesCacheKey,
} from '@/lib/admin/admin-cache-keys';
import type { LanguageCode } from '@/lib/language';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';

function adminCategoriesRequestKey(language: LanguageCode, includeCounts: boolean): string {
  return buildAdminCategoriesCacheKey(language, { includeCounts });
}

export function readAdminCategoriesCache<T = unknown>(
  language: LanguageCode,
  options?: { includeCounts?: boolean },
): T[] | null {
  const data = readAdminSessionCache<T[]>(
    adminCategoriesRequestKey(language, options?.includeCounts !== false),
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  return data ?? null;
}

export function writeAdminCategoriesCache<T>(
  language: LanguageCode,
  data: T[],
  options?: { includeCounts?: boolean },
): void {
  writeAdminSessionCache(
    adminCategoriesRequestKey(language, options?.includeCounts !== false),
    data,
  );
}

export function readAdminBrandsCache<T = unknown>(): T[] | null {
  const data = readAdminSessionCache<T[]>(ADMIN_CACHE_KEYS.brands, ADMIN_SESSION_CACHE_TTL_MS);
  return data ?? null;
}

export function writeAdminBrandsCache<T>(data: T[]): void {
  writeAdminSessionCache(ADMIN_CACHE_KEYS.brands, data);
}

/** Brands list — shared by warm (hover) and brands page. */
export function fetchAdminBrands<T>(
  options?: { force?: boolean },
): Promise<T[]> {
  const cached = readAdminBrandsCache<T>();
  if (!options?.force && cached !== null) {
    return Promise.resolve(cached);
  }

  return dedupedAdminRequest(ADMIN_CACHE_KEYS.brands, () =>
    apiClient.get<{ data: T[] }>('/api/v1/supersudo/brands'),
  ).then((response) => {
    const data = response.data ?? [];
    writeAdminBrandsCache(data);
    return data;
  });
}

/** Lite categories for filters — shared by warm (hover) and page fetch. */
export function fetchAdminCategoriesLite<T>(language: LanguageCode): Promise<{ data: T[] }> {
  const cached = readAdminCategoriesCache<T>(language, { includeCounts: false });
  if (cached !== null) {
    return Promise.resolve({ data: cached });
  }

  const requestKey = adminCategoriesRequestKey(language, false);
  return dedupedAdminRequest(requestKey, () =>
    apiClient.get<{ data: T[] }>('/api/v1/supersudo/categories', {
      params: { lang: language, counts: 'false' },
    }),
  ).then((response) => {
    const data = response.data ?? [];
    writeAdminCategoriesCache(language, data, { includeCounts: false });
    return { data };
  });
}

/** Full categories list with product counts — admin categories page. */
function fetchAdminCategoriesWithCounts<T>(language: LanguageCode): Promise<{ data: T[] }> {
  const cached = readAdminCategoriesCache<T>(language, { includeCounts: true });
  if (cached !== null) {
    return Promise.resolve({ data: cached });
  }

  const requestKey = adminCategoriesRequestKey(language, true);
  return dedupedAdminRequest(requestKey, () =>
    apiClient.get<{ data: T[] }>('/api/v1/supersudo/categories', {
      params: { lang: language },
    }),
  ).then((response) => {
    const data = response.data ?? [];
    writeAdminCategoriesCache(language, data, { includeCounts: true });
    return { data };
  });
}

export function warmAdminCategoriesWithCountsCache(language: LanguageCode): void {
  if (
    typeof window === 'undefined' ||
    readAdminCategoriesCache(language, { includeCounts: true }) !== null
  ) {
    return;
  }
  void fetchAdminCategoriesWithCounts(language);
}

/** Warms categories only (e.g. products page filter). */
export function warmAdminCategoriesCache(language: LanguageCode): void {
  if (
    typeof window === 'undefined' ||
    readAdminCategoriesCache(language, { includeCounts: false }) !== null
  ) {
    return;
  }
  void fetchAdminCategoriesLite(language);
}

/** Warms categories + brands — for pages that need both. */
export function warmAdminReferenceDataCaches(language: LanguageCode): void {
  if (typeof window === 'undefined') {
    return;
  }

  warmAdminCategoriesCache(language);

  if (readAdminBrandsCache() === null) {
    void fetchAdminBrands();
  }
}

type AdminAttributesPayload<T> = { data: T[] };

export function readAdminAttributesCache<T = unknown>(): T[] | null {
  const cached = readAdminSessionCache<AdminAttributesPayload<T>>(
    ADMIN_CACHE_KEYS.attributes,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  return cached?.data ?? null;
}

/** Attributes list — shared by warm, attributes page, and product editor. */
export function fetchAdminAttributes<T>(options?: { force?: boolean }): Promise<T[]> {
  const cached = readAdminAttributesCache<T>();
  if (!options?.force && cached !== null) {
    return Promise.resolve(cached);
  }

  return dedupedAdminRequest(ADMIN_CACHE_KEYS.attributes, () =>
    apiClient.get<AdminAttributesPayload<T>>('/api/v1/supersudo/attributes'),
  ).then((response) => {
    const data = response.data ?? [];
    writeAdminSessionCache(ADMIN_CACHE_KEYS.attributes, { data });
    return data;
  });
}

/** Settings document — shared by warm, settings page, and product editor pricing. */
export function fetchAdminSettings<T>(options?: { force?: boolean }): Promise<T> {
  const cached = readAdminSessionCache<T>(ADMIN_CACHE_KEYS.settings, ADMIN_SESSION_CACHE_TTL_MS);
  if (!options?.force && cached !== null) {
    return Promise.resolve(cached);
  }

  return dedupedAdminRequest(ADMIN_CACHE_KEYS.settings, () =>
    apiClient.get<T>('/api/v1/supersudo/settings'),
  ).then((settings) => {
    writeAdminSessionCache(ADMIN_CACHE_KEYS.settings, settings);
    return settings;
  });
}
