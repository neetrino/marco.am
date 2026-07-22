import { NextRequest, NextResponse } from "next/server";
import { isMockPaymentFlowAllowed } from "@/lib/config/payment-env";
import { resolveIdramConfig } from "@/lib/payments/idram/config";
import { handleIdramResult } from "@/lib/payments/idram/handle-result";
import { buildOrderPaidRedirectUrl } from "@/lib/payments/payment-urls";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

/**
 * Local-only Idram mock completion (IDRAM_DEV_MOCK=true).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isMockPaymentFlowAllowed() || !resolveIdramConfig().devMock) {
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/forbidden",
        title: "Forbidden",
        status: 403,
        detail: "Idram mock flow is disabled",
      },
      { status: 403 },
    );
  }

  let orderNumber = request.nextUrl.searchParams.get("order")?.trim() || null;
  let amount = request.nextUrl.searchParams.get("EDP_AMOUNT")?.trim() || null;

  try {
    const form = await request.formData();
    if (!orderNumber) {
      const bill = form.get("EDP_BILL_NO");
      orderNumber = typeof bill === "string" ? bill.trim() : null;
    }
    if (!amount) {
      const rawAmount = form.get("EDP_AMOUNT");
      amount = typeof rawAmount === "string" ? rawAmount.trim() : null;
    }
  } catch {
    // GET without body
  }

  if (!orderNumber) {
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        status: 400,
        detail: "order is required",
      },
      { status: 400 },
    );
  }

  const edpAmount = amount ?? "0.00";

  try {
    await handleIdramResult({
      EDP_PRECHECK: "YES",
      EDP_BILL_NO: orderNumber,
      EDP_REC_ACCOUNT: "mock",
      EDP_AMOUNT: edpAmount,
    });

    await handleIdramResult({
      EDP_BILL_NO: orderNumber,
      EDP_REC_ACCOUNT: "mock",
      EDP_AMOUNT: edpAmount,
      EDP_PAYER_ACCOUNT: "mock-payer",
      EDP_TRANS_ID: `mock_${Date.now()}`,
      EDP_TRANS_DATE: new Date().toISOString(),
      EDP_CHECKSUM: "mock",
    });

    return NextResponse.redirect(buildOrderPaidRedirectUrl(orderNumber), 302);
  } catch (error) {
    logger.error("Idram mock complete failed", { orderNumber, error });
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Error",
        status: 500,
        detail: "Mock Idram completion failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return POST(request);
}
