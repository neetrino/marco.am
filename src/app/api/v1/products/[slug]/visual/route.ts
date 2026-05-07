import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { productsService } from "@/lib/services/products.service";
import { getCachedJson } from "@/lib/services/read-through-json-cache";

const PDP_VISUAL_CACHE_TTL_SEC = 120;

function pdpVisualCacheKey(slug: string, lang: string): string {
  const hash = createHash("sha256").update(`pdp:visual\0${slug}\0${lang}`).digest("hex");
  return `cache:products:pdp:visual:v1:${hash}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const { slug } = await params;
    const cacheKey = pdpVisualCacheKey(slug, lang);
    const result = await getCachedJson(cacheKey, PDP_VISUAL_CACHE_TTL_SEC, () =>
      productsService.findBySlugVisual(slug, lang),
      { requireSharedCache: true },
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    return toApiErrorResponse(error, req.url);
  }
}
