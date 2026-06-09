import { apiClient } from '@/lib/api-client';
import { ADMIN_CACHE_KEYS } from '@/lib/admin/admin-cache-keys';
import type { LanguageCode } from '@/lib/language';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';

const warmInFlight = new Set<string>();

function categoriesKeyForLanguage(language: LanguageCode): string {
  return `${ADMIN_CACHE_KEYS.categories}:${language}`;
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

/** Warms categories + brands lists used across multiple admin pages. */
export function warmAdminReferenceDataCaches(language: LanguageCode): void {
  if (typeof window === 'undefined') {
    return;
  }

  const categoriesFlightKey = `categories:${language}`;
  if (!readAdminCategoriesCache(language) && !warmInFlight.has(categoriesFlightKey)) {
    warmInFlight.add(categoriesFlightKey);
    void apiClient
      .get<{ data: unknown[] }>('/api/v1/supersudo/categories', {
        params: { lang: language },
      })
      .then((response) => {
        writeAdminCategoriesCache(language, response.data ?? []);
      })
      .finally(() => {
        warmInFlight.delete(categoriesFlightKey);
      });
  }

  if (!readAdminBrandsCache() && !warmInFlight.has('brands')) {
    warmInFlight.add('brands');
    void apiClient
      .get<{ data: unknown[] }>('/api/v1/supersudo/brands')
      .then((response) => {
        writeAdminBrandsCache(response.data ?? []);
      })
      .finally(() => {
        warmInFlight.delete('brands');
      });
  }
}
