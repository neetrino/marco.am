import { NextResponse } from "next/server";
import { isCronRequestAuthorized } from "@/lib/payments/reconcile/authorize-cron";
import {
  EMPTY_GUEST_LIST_MIN_AGE_MS,
  runGuestListCleanup,
} from "@/lib/services/guest-list-cleanup.service";
import { logger } from "@/lib/utils/logger";
import { toApiError } from "@/lib/types/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Allow enough time to batch-delete expired/empty guest lists. */
export const maxDuration = 60;

/**
 * Vercel Cron entry: deletes expired guest lists and empty guest lists older than 24h.
 * Secured with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request)) {
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Invalid or missing cron authorization",
      },
      { status: 401 },
    );
  }

  try {
    const summary = await runGuestListCleanup({
      emptyMinAgeMs: EMPTY_GUEST_LIST_MIN_AGE_MS,
    });
    logger.info("Guest list cleanup cron completed", { summary });
    return NextResponse.json({ ok: true, summary }, { status: 200 });
  } catch (error: unknown) {
    logger.error("Guest list cleanup cron failed", { error });
    const apiError = toApiError(error, request.url);
    return NextResponse.json(apiError, { status: apiError.status ?? 500 });
  }
}
