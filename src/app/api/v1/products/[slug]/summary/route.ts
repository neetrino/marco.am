import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { productsService } from "@/lib/services/products.service";
import { getCachedJson } from "@/lib/services/read-through-json-cache";

const PRODUCT_SUMMARY_CACHE_TTL_SEC = 60;

function productSummaryCacheKey(slug: string, lang: string): string {
  const hash = createHash("sha256")
    .update(`pdp:summary\0${slug}\0${lang}`)
    .digest("hex");
  return `cache:products:summary:v1:${hash}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang") || "en";
    const { slug } = await params;
    const cacheKey = productSummaryCacheKey(slug, lang);
    const result = await getCachedJson(
      cacheKey,
      PRODUCT_SUMMARY_CACHE_TTL_SEC,
      () => productsService.findBySlugSummary(slug, lang),
      { requireSharedCache: true },
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    return toApiErrorResponse(error, req.url);
  }
}
