import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { parseProductListFiltersFromSearchParams } from "@/lib/cache/parse-products-list-filters";
import { getProductsListingCached } from "@/lib/cache/products-listing-redis";

const PRODUCTS_API_CACHE_CONTROL = "public, max-age=30, stale-while-revalidate=120";

const EMPTY_LISTING_FILTERS = {
  availableCategories: [] as const,
  availableBrands: [] as const,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseProductListFiltersFromSearchParams(searchParams);
    const result = await getProductsListingCached(filters);

    const response = {
      items: result.data,
      pagination: {
        page: result.meta.page,
        limit: result.meta.limit,
        total: result.meta.total,
        totalPages: result.meta.totalPages,
        hasNextPage: result.meta.hasNextPage,
        nextCursor: result.meta.nextCursor,
      },
      // Facets are served by GET /api/v1/products/filters — kept for backward compatibility.
      filters: EMPTY_LISTING_FILTERS,
      // Backward-compatible aliases for existing callers.
      data: result.data,
      meta: result.meta,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": PRODUCTS_API_CACHE_CONTROL,
      },
    });
  } catch (error: unknown) {
    logger.error("Products API error", { error });
    const err = error as { type?: string; title?: string; status?: number; detail?: string; message?: string };
    return NextResponse.json(
      {
        type: err.type || "https://api.shop.am/problems/internal-error",
        title: err.title || "Internal Server Error",
        status: err.status || 500,
        detail: err.detail || err.message || "An error occurred",
        instance: req.url,
      },
      { status: err.status || 500 }
    );
  }
}
