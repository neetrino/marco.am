import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { withApiRouteMetrics } from '@/lib/observability/api-route-metrics';
import { formatServerTiming, type ServerTimingMetric } from '@/lib/observability/server-timing';
import {
  getProductsPlpReadModelPayload,
  type PlpReadModelSearchParams,
} from '@/lib/read-model/products-plp-read-model';
import { parseTechnicalSpecFiltersFromSearchParams } from '@/lib/services/products-technical-filters';

const PRODUCTS_PLP_API_CACHE_CONTROL = 'public, max-age=30, stale-while-revalidate=120';

function toParams(searchParams: URLSearchParams): PlpReadModelSearchParams {
  return {
    lang: searchParams.get('lang') || 'en',
    page: searchParams.get('page') || undefined,
    limit: searchParams.get('limit') || undefined,
    ids: searchParams.get('ids') || undefined,
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    filter: searchParams.get('filter') || searchParams.get('filters') || undefined,
    minPrice: searchParams.get('minPrice') || undefined,
    maxPrice: searchParams.get('maxPrice') || undefined,
    pricePresence: searchParams.get('pricePresence') || undefined,
    colors: searchParams.get('colors') || undefined,
    sizes: searchParams.get('sizes') || undefined,
    sort: searchParams.get('sort') || undefined,
    technicalSpecs: parseTechnicalSpecFiltersFromSearchParams(searchParams),
    includeFilters: searchParams.get('includeFilters') || undefined,
    includeItems: searchParams.get('includeItems') || undefined,
  };
}

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  return withApiRouteMetrics(
    '/api/v1/products/plp',
    'GET',
    async () => {
      try {
        const timings: ServerTimingMetric[] = [];
        const parseStartedAt = Date.now();
        const { searchParams } = new URL(req.url);
        const params = toParams(searchParams);
        timings.push({ name: 'parse', durationMs: Date.now() - parseStartedAt });

        const listingStartedAt = Date.now();
        const payload = await getProductsPlpReadModelPayload(params);
        timings.push({ name: 'listing', durationMs: Date.now() - listingStartedAt });

        return NextResponse.json(payload, {
          headers: {
            'Cache-Control': PRODUCTS_PLP_API_CACHE_CONTROL,
            'X-Route-Duration-Ms': String(Date.now() - startedAt),
            'Server-Timing': formatServerTiming([
              ...timings,
              { name: 'total', durationMs: Date.now() - startedAt },
            ]),
          },
        });
      } catch (error: unknown) {
        logger.error('Products PLP read-model API error', { error });
        const err = error as {
          type?: string;
          title?: string;
          status?: number;
          detail?: string;
          message?: string;
        };
        return NextResponse.json(
          {
            type: err.type || 'https://api.shop.am/problems/internal-error',
            title: err.title || 'Internal Server Error',
            status: err.status || 500,
            detail: err.detail || err.message || 'An error occurred',
            instance: req.url,
          },
          {
            status: err.status || 500,
            headers: {
              'X-Route-Duration-Ms': String(Date.now() - startedAt),
            },
          },
        );
      }
    },
    (res) => res.status,
  );
}
