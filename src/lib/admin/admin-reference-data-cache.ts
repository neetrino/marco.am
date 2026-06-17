import { apiClient } from '@/lib/api-client';
import { ADMIN_CACHE_KEYS } from '@/lib/admin/admin-cache-keys';
import type { LanguageCode } from '@/lib/language';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';

function categoriesKeyForLanguage(language: LanguageCode): string {
  return `${ADMIN_CACHE_KEYS.categories}:${language}`;
}

function adminCategoriesLiteRequestKey(language: LanguageCode): string {
  return `categories:${language}:lite`;
}

export function readAdminCategoriesCache<T = unknown>(language: LanguageCode): T[] | null {
  const data = readAdminSessionCache<T[]>(
    categoriesKeyForLanguage(language),
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  return data ?? null;
}

export function writeAdminCategoriesCache<T>(language: LanguageCode, data: T[]): void {
  writeAdminSessionCache(categoriesKeyForLanguage(language), data);
}

export function readAdminBrandsCache<T = unknown>(): T[] | null {
  const data = readAdminSessionCache<T[]>(ADMIN_CACHE_KEYS.brands, ADMIN_SESSION_CACHE_TTL_MS);
  return data ?? null;
}

export function writeAdminBrandsCache<T>(data: T[]): void {
  writeAdminSessionCache(ADMIN_CACHE_KEYS.brands, data);
}

/** Lite categories for filters — shared by warm (hover) and page fetch. */
export function fetchAdminCategoriesLite<T>(language: LanguageCode): Promise<{ data: T[] }> {
  const cached = readAdminCategoriesCache<T>(language);
  if (cached?.length) {
    return Promise.resolve({ data: cached });
  }

  const requestKey = adminCategoriesLiteRequestKey(language);
  return dedupedAdminRequest(requestKey, () =>
    apiClient.get<{ data: T[] }>('/api/v1/supersudo/categories', {
      params: { lang: language, counts: 'false' },
    }),
  ).then((response) => {
    const data = response.data ?? [];
    writeAdminCategoriesCache(language, data);
    return { data };
  });
}

/** Warms categories only (e.g. products page filter). */
export function warmAdminCategoriesCache(language: LanguageCode): void {
  if (typeof window === 'undefined' || readAdminCategoriesCache(language)?.length) {
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

  if (!readAdminBrandsCache()) {
    void dedupedAdminRequest('brands', () =>
      apiClient.get<{ data: unknown[] }>('/api/v1/supersudo/brands'),
    ).then((response) => {
      writeAdminBrandsCache(response.data ?? []);
    });
  }
}
