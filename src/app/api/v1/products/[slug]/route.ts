import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { productsService } from "@/lib/services/products.service";
import { getCachedJson } from "@/lib/services/read-through-json-cache";

const PRODUCT_DETAIL_CACHE_TTL_SEC = 90;

function productDetailCacheKey(slug: string, lang: string): string {
  const hash = createHash("sha256").update(`${slug}\0${lang}`).digest("hex");
  return `cache:products:detail:v1:${hash}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const { slug } = await params;
    const cacheKey = productDetailCacheKey(slug, lang);
    const result = await getCachedJson(cacheKey, PRODUCT_DETAIL_CACHE_TTL_SEC, () =>
      productsService.findBySlug(slug, lang),
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("❌ [PRODUCTS] Error:", error);
    return toApiErrorResponse(error, req.url);
  }
}
