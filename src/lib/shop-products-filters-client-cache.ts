import type { ProductsFiltersData } from '@/components/ProductsFiltersProvider';

const FILTERS_CACHE_TTL_MS = 120_000;

const filtersCache = new Map<string, { payload: ProductsFiltersData; storedAt: number }>();

export function readShopFiltersCache(filtersKey: string): ProductsFiltersData | null {
  const entry = filtersCache.get(filtersKey);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.storedAt > FILTERS_CACHE_TTL_MS) {
    filtersCache.delete(filtersKey);
    return null;
  }
  return entry.payload;
}

export function writeShopFiltersCache(filtersKey: string, payload: ProductsFiltersData): void {
  filtersCache.set(filtersKey, { payload, storedAt: Date.now() });
}
