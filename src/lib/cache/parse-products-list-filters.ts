import type { ProductFilters } from '@/lib/services/products-find-query/types';
import { parseTechnicalSpecFiltersFromSearchParams } from '@/lib/services/products-technical-filters';

/**
 * Normalized product list filters from request query (API route + any caller).
 */
export function parseProductListFiltersFromSearchParams(
  searchParams: URLSearchParams,
): ProductFilters {
  const minPriceRaw = searchParams.get('minPrice');
  const maxPriceRaw = searchParams.get('maxPrice');
  const parsedMinPrice = minPriceRaw ? Number(minPriceRaw) : undefined;
  const parsedMaxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;
  const hasValidMinPrice =
    typeof parsedMinPrice === 'number' && Number.isFinite(parsedMinPrice) && parsedMinPrice >= 0;
  const hasValidMaxPrice =
    typeof parsedMaxPrice === 'number' && Number.isFinite(parsedMaxPrice) && parsedMaxPrice >= 0;
  const minPrice = hasValidMinPrice ? parsedMinPrice : undefined;
  const maxPrice = hasValidMaxPrice ? parsedMaxPrice : undefined;
  const normalizedMinPrice =
    minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice ? maxPrice : minPrice;
  const normalizedMaxPrice =
    minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice ? minPrice : maxPrice;

  const parsedPage = Number(searchParams.get('page'));
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedLimit = Number(searchParams.get('limit'));

  const idsParam = searchParams.get('ids');
  const productIdsFromQuery =
    idsParam
      ?.split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0)
      .slice(0, 500) ?? [];

  const limit =
    productIdsFromQuery.length > 0
      ? Math.min(Math.max(productIdsFromQuery.length, 1), 500)
      : Number.isInteger(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 200)
        : 12;

  const cursor = searchParams.get('cursor') || undefined;
  const technicalSpecs = parseTechnicalSpecFiltersFromSearchParams(searchParams);

  return {
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    filter: searchParams.get('filter') || searchParams.get('filters') || undefined,
    minPrice: normalizedMinPrice,
    maxPrice: normalizedMaxPrice,
    colors: searchParams.get('colors') || undefined,
    sizes: searchParams.get('sizes') || undefined,
    brand: searchParams.get('brand') || undefined,
    sort: searchParams.get('sort') || 'createdAt',
    page,
    limit,
    cursor,
    lang: searchParams.get('lang') || 'en',
    technicalSpecs,
    productIds: productIdsFromQuery.length > 0 ? productIdsFromQuery : undefined,
  };
}
