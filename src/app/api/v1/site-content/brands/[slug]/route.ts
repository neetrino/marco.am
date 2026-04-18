import { NextRequest, NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { siteContentService } from "@/lib/services/site-content.service";
import { logger } from "@/lib/utils/logger";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

/**
 * Public Brand page content + brand translation fallback for one slug.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const slug = params.slug.trim();
    if (!slug) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail: "Brand slug is required",
          instance: req.url,
        },
        { status: 400 },
      );
    }

    const payload = await siteContentService.getBrandPagePublicPayload({
      slug,
      localeRaw: req.nextUrl.searchParams.get("locale"),
      acceptLanguageRaw: req.headers.get("accept-language"),
    });
    if (!payload) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/not-found",
          title: "Not Found",
          status: 404,
          detail: "Brand page not found",
          instance: req.url,
        },
        { status: 404 },
      );
    }
    return NextResponse.json(payload);
  } catch (error: unknown) {
    logger.error("GET /api/v1/site-content/brands/[slug] failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
