import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { buildPdpDetailApiCacheKey } from "@/lib/product-pdp/pdp-cache-keys";
import { PDP_CACHE_TTL_SEC } from "@/lib/product-pdp/pdp-cache-ttl";
import { productsService } from "@/lib/services/products.service";
import { getCachedJson } from "@/lib/services/read-through-json-cache";
import { toApiError } from "@/lib/types/errors";

const PRODUCT_DETAIL_CACHE_TTL_SEC = PDP_CACHE_TTL_SEC;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const { slug } = await params;
    const cacheKey = buildPdpDetailApiCacheKey(slug, lang);
    const result = await getCachedJson(cacheKey, PRODUCT_DETAIL_CACHE_TTL_SEC, () =>
      productsService.findBySlug(slug, lang),
      { requireSharedCache: true },
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    const apiError = toApiError(error, req.url);
    if ((apiError.status ?? 500) >= 500) {
      console.error("❌ [PRODUCTS] Error:", error);
    }
    return toApiErrorResponse(error, req.url);
  }
}
