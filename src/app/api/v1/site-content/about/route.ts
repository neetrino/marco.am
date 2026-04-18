import { NextRequest, NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { siteContentService } from "@/lib/services/site-content.service";
import { logger } from "@/lib/utils/logger";

/**
 * Public About Us page content (CMS/static) with locale fallback.
 * Locale order: `?locale=` -> `Accept-Language` -> `hy`.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await siteContentService.getAboutPublicPayload({
      localeRaw: req.nextUrl.searchParams.get("locale"),
      acceptLanguageRaw: req.headers.get("accept-language"),
    });
    return NextResponse.json(payload);
  } catch (error: unknown) {
    logger.error("GET /api/v1/site-content/about failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
