import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { whyChooseUsService } from "@/lib/services/why-choose-us.service";
import { logger } from "@/lib/utils/logger";

/**
 * Public home «Why choose us» — section title + active items for one locale.
 * Query: `locale` — `en` | `hy` | `ru` (default `en`).
 */
export async function GET(req: NextRequest) {
  try {
    const locale = req.nextUrl.searchParams.get("locale") ?? "en";
    const payload = await whyChooseUsService.getPublicPayload(locale);
    return NextResponse.json(payload);
  } catch (error: unknown) {
    logger.error("GET /api/v1/home/why-choose-us failed", { error });
    return toApiErrorResponse(error, req.url);
  }
}
