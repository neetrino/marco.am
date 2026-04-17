import { NextRequest, NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { homeBrandPartnersService } from "@/lib/services/home-brand-partners.service";
import { logger } from "@/lib/utils/logger";

/**
 * Public home brand partners — localized names/descriptions, logo URLs, PLP links.
 * Query: `locale` — `en` | `hy` | `ru` (default `en`).
 */
export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get("locale") ?? "en";
    const payload = await homeBrandPartnersService.getPublicPayload(locale);
    return NextResponse.json(payload);
  } catch (error: unknown) {
    logger.error("GET /api/v1/home/brand-partners failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
