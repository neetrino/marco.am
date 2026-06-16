import { NextRequest, NextResponse } from 'next/server';
import { toApiErrorResponse } from '@/lib/api/next-route-error';
import { getShopCategoryFacetTreeCached } from '@/lib/cache/shop-category-facet-tree-cache';
import { PRODUCTS_FILTERS_SHELL_CACHE_CONTROL } from '@/lib/api/parse-products-filters-request';
import { logger } from '@/lib/utils/logger';
import { withApiRouteMetrics } from '@/lib/observability/api-route-metrics';

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  return withApiRouteMetrics(
    '/api/v1/products/filters/categories',
    'GET',
    async () => {
      try {
        const lang = new URL(req.url || '').searchParams.get('lang') || 'en';
        const categories = await getShopCategoryFacetTreeCached(lang);
        return NextResponse.json(
          { categories },
          {
            headers: {
              'Cache-Control': PRODUCTS_FILTERS_SHELL_CACHE_CONTROL,
              'X-Route-Duration-Ms': String(Date.now() - startedAt),
            },
          },
        );
      } catch (error: unknown) {
        logger.error('Products filters categories API error', { error });
        const res = toApiErrorResponse(error, req.url || '');
        res.headers.set('X-Route-Duration-Ms', String(Date.now() - startedAt));
        return res;
      }
    },
    (res) => res.status,
  );
}
