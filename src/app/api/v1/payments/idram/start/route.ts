import { NextRequest, NextResponse } from "next/server";
import {
  buildIdramPaymentForm,
  renderAutoSubmitHtml,
} from "@/lib/payments/idram/form";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

/**
 * GET — auto-submits Idram payment form (or local mock).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const orderNumber = request.nextUrl.searchParams.get("order")?.trim();
  if (!orderNumber) {
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        status: 400,
        detail: "order query parameter is required",
      },
      { status: 400 },
    );
  }

  try {
    const form = await buildIdramPaymentForm(orderNumber);
    return new NextResponse(renderAutoSubmitHtml(form), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    const err = error as { status?: number; detail?: string; title?: string };
    logger.error("Idram start failed", { orderNumber, error });
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: err.title ?? "Error",
        status: err.status ?? 500,
        detail: err.detail ?? "Failed to start Idram payment",
      },
      { status: err.status ?? 500 },
    );
  }
}
