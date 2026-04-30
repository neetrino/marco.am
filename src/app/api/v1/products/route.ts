import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";
import { parseProductListFiltersFromSearchParams } from "@/lib/cache/parse-products-list-filters";
import { getProductsListingCached } from "@/lib/cache/products-listing-redis";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseProductListFiltersFromSearchParams(searchParams);
    const result = await getProductsListingCached(filters);
    return NextResponse.json(result);
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
