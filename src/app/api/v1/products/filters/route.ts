import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { logger } from "@/lib/utils/logger";
import { withApiRouteMetrics } from "@/lib/observability/api-route-metrics";
import {
  parseProductsFiltersRequest,
  PRODUCTS_FILTERS_API_CACHE_CONTROL,
} from "@/lib/api/parse-products-filters-request";
import { getProductsFiltersCached } from "@/lib/cache/products-filters-redis";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  return withApiRouteMetrics(
    "/api/v1/products/filters",
    "GET",
    async () => {
      try {
        let filters;
        try {
          filters = parseProductsFiltersRequest(req);
        } catch (urlError) {
          logger.error("Products filters URL parse error", { error: urlError });
          return NextResponse.json(
            {
              type: "https://api.shop.am/problems/internal-error",
              title: "Internal Server Error",
              status: 500,
              detail: "Invalid request URL",
              instance: req.url || "",
            },
            { status: 500 }
          );
        }

        const result = await getProductsFiltersCached({
          category: filters.category,
          search: filters.search,
          filter: filters.filter,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          lang: filters.lang,
          technicalSpecs: filters.technicalSpecs,
          includeCategories: filters.includeCategories,
          categoriesOnly: filters.categoriesOnly,
        });
        return NextResponse.json(result, {
          headers: {
            "Cache-Control": PRODUCTS_FILTERS_API_CACHE_CONTROL,
            "X-Route-Duration-Ms": String(Date.now() - startedAt),
          },
        });
      } catch (error: unknown) {
        logger.error("Products filters API error", { error });
        const res = toApiErrorResponse(error, req.url || "");
        res.headers.set("X-Route-Duration-Ms", String(Date.now() - startedAt));
        return res;
      }
    },
    (res) => res.status,
  );
}
