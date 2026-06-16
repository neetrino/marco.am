import { NextRequest, NextResponse } from 'next/server';
import { toApiErrorResponse } from '@/lib/api/next-route-error';
import {
  PRODUCTS_FILTERS_SHELL_CACHE_CONTROL,
} from '@/lib/api/parse-products-filters-request';
import { logger } from '@/lib/utils/logger';
import { withApiRouteMetrics } from '@/lib/observability/api-route-metrics';
import { getShopFiltersInstantShell } from '@/lib/services/shop-filters-instant-shell.service';

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  return withApiRouteMetrics(
    '/api/v1/products/filters/shell',
    'GET',
    async () => {
      try {
        const lang = new URL(req.url || '').searchParams.get('lang') || 'en';
        const result = await getShopFiltersInstantShell(lang);
        return NextResponse.json(result, {
          headers: {
            'Cache-Control': PRODUCTS_FILTERS_SHELL_CACHE_CONTROL,
            'X-Route-Duration-Ms': String(Date.now() - startedAt),
          },
        });
      } catch (error: unknown) {
        logger.error('Products filters shell API error', { error });
        const res = toApiErrorResponse(error, req.url || '');
        res.headers.set('X-Route-Duration-Ms', String(Date.now() - startedAt));
        return res;
      }
    },
    (res) => res.status,
  );
}
