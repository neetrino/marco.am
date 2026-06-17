import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { productsRelatedService } from "@/lib/services/products-related.service";
import { getCachedJson } from "@/lib/services/read-through-json-cache";

const RELATED_LIST_CACHE_TTL_SEC = 300;

function relatedListCacheKey(slug: string, lang: string, limit: number, offset: number): string {
  const hash = createHash("sha256")
    .update(`pdp:related:v2\0${slug}\0${lang}\0${limit}\0${offset}`)
    .digest("hex");
  return `cache:products:pdp:related:v2:${hash}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const requestedLimit = Number(searchParams.get("limit"));
    const requestedOffset = Number(searchParams.get("offset"));
    const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? requestedLimit
      : 4;
    const offset = Number.isInteger(requestedOffset) && requestedOffset >= 0
      ? requestedOffset
      : 0;
    const { slug } = await params;
    const cacheKey = relatedListCacheKey(slug, lang, limit, offset);
    const result = await getCachedJson(cacheKey, RELATED_LIST_CACHE_TTL_SEC, () =>
      productsRelatedService.findBySlug(slug, lang, limit, offset),
      { requireSharedCache: true },
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    return toApiErrorResponse(error, req.url);
  }
}
