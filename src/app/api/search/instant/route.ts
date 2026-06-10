import { NextRequest, NextResponse } from 'next/server';
import { toApiErrorResponse } from '@/lib/api/next-route-error';
import { withApiRouteMetrics } from '@/lib/observability/api-route-metrics';
import {
  parseInstantSearchRequest,
  searchInstant,
} from '@/lib/services/instant-search.service';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/search/instant
 * Query params:
 * - q (required)
 * - locale | lang (optional): hy | ru | en
 * Locale resolution: `?locale=` -> `?lang=` -> `Accept-Language` -> `hy`.
 * - limit (optional): product limit alias for backward compatibility
 * - productLimit (optional): products max count
 * - categoryLimit (optional): categories max count
 */
export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  return withApiRouteMetrics(
    "/api/search/instant",
    "GET",
    async () => {
      try {
        const { searchParams } = new URL(req.url);
        const params = parseInstantSearchRequest({
          searchParams,
          acceptLanguageRaw: req.headers.get("accept-language"),
        });
        const payload = await searchInstant(params);

        return NextResponse.json(payload, {
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'X-Route-Duration-Ms': String(Date.now() - startedAt),
          },
        });
      } catch (error: unknown) {
        logger.error('Instant search request failed', { error });
        const res = toApiErrorResponse(error, req.url);
        res.headers.set('X-Route-Duration-Ms', String(Date.now() - startedAt));
        return res;
      }
    },
    (res) => res.status,
  );
}
