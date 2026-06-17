import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { buildPdpVisualApiCacheKey } from "@/lib/product-pdp/pdp-cache-keys";
import { productsService } from "@/lib/services/products.service";
import { getCachedJson } from "@/lib/services/read-through-json-cache";

const PDP_VISUAL_CACHE_TTL_SEC = 120;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const { slug } = await params;
    const cacheKey = buildPdpVisualApiCacheKey(slug, lang);
    const result = await getCachedJson(cacheKey, PDP_VISUAL_CACHE_TTL_SEC, () =>
      productsService.findBySlugVisual(slug, lang),
      { requireSharedCache: true },
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    return toApiErrorResponse(error, req.url);
  }
}
