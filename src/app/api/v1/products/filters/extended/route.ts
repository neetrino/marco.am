import { NextRequest, NextResponse } from 'next/server';
import { toApiErrorResponse } from '@/lib/api/next-route-error';
import {
  parseProductsFiltersRequest,
  PRODUCTS_FILTERS_API_CACHE_CONTROL,
} from '@/lib/api/parse-products-filters-request';
import { logger } from '@/lib/utils/logger';
import { withApiRouteMetrics } from '@/lib/observability/api-route-metrics';
import { getProductsFiltersExtendedCached } from '@/lib/cache/products-filters-redis';

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  return withApiRouteMetrics(
    '/api/v1/products/filters/extended',
    'GET',
    async () => {
      try {
        const filters = parseProductsFiltersRequest(req);
        const result = await getProductsFiltersExtendedCached({
          category: filters.category,
          search: filters.search,
          filter: filters.filter,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          lang: filters.lang,
          technicalSpecs: filters.technicalSpecs,
        });
        return NextResponse.json(result, {
          headers: {
            'Cache-Control': PRODUCTS_FILTERS_API_CACHE_CONTROL,
            'X-Route-Duration-Ms': String(Date.now() - startedAt),
          },
        });
      } catch (error: unknown) {
        logger.error('Products filters extended API error', { error });
        const res = toApiErrorResponse(error, req.url || '');
        res.headers.set('X-Route-Duration-Ms', String(Date.now() - startedAt));
        return res;
      }
    },
    (res) => res.status,
  );
}
