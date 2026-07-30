import { NextResponse } from "next/server";
import { isCronRequestAuthorized } from "@/lib/payments/reconcile/authorize-cron";
import { reconcilePendingArcaPayments } from "@/lib/payments/reconcile/reconcile-pending-arca";
import { logger } from "@/lib/utils/logger";
import { toApiError } from "@/lib/types/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Allow enough time to poll a batch of pending ArCa payments. */
export const maxDuration = 60;

/**
 * Vercel Cron entry: reconciles pending ArCa payments against the bank.
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
    const summary = await reconcilePendingArcaPayments();
    return NextResponse.json({ ok: true, summary }, { status: 200 });
  } catch (error: unknown) {
    logger.error("Payment reconcile cron failed", { error });
    const apiError = toApiError(error, request.url);
    return NextResponse.json(apiError, { status: apiError.status ?? 500 });
  }
}
