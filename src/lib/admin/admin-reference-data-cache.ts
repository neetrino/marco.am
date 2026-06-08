import { apiClient } from '@/lib/api-client';
import { ADMIN_CACHE_KEYS } from '@/lib/admin/admin-cache-keys';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';

const warmInFlight = new Set<'categories' | 'brands'>();

export function readAdminCategoriesCache<T = unknown>(): T[] | null {
  const data = readAdminSessionCache<T[]>(ADMIN_CACHE_KEYS.categories, ADMIN_SESSION_CACHE_TTL_MS);
  return data ?? null;
}

export function writeAdminCategoriesCache<T>(data: T[]): void {
  writeAdminSessionCache(ADMIN_CACHE_KEYS.categories, data);
}

export function readAdminBrandsCache<T = unknown>(): T[] | null {
  const data = readAdminSessionCache<T[]>(ADMIN_CACHE_KEYS.brands, ADMIN_SESSION_CACHE_TTL_MS);
  return data ?? null;
}

export function writeAdminBrandsCache<T>(data: T[]): void {
  writeAdminSessionCache(ADMIN_CACHE_KEYS.brands, data);
}

/** Warms categories + brands lists used across multiple admin pages. */
export function warmAdminReferenceDataCaches(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!readAdminCategoriesCache() && !warmInFlight.has('categories')) {
    warmInFlight.add('categories');
    void apiClient
      .get<{ data: unknown[] }>('/api/v1/supersudo/categories')
      .then((response) => {
        writeAdminCategoriesCache(response.data ?? []);
      })
      .finally(() => {
        warmInFlight.delete('categories');
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
