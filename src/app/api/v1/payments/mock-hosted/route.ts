import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";
import { processPaymentWebhook } from "@/lib/services/payment-psp.service";
import { getPublicAppUrl } from "@/lib/config/deployment-env";
import { logger } from "@/lib/utils/logger";

type MockStatus = "succeeded" | "failed" | "cancelled" | "expired";

function getMockStatus(raw: string | null): MockStatus {
  if (raw === "failed" || raw === "cancelled" || raw === "expired") {
    return raw;
  }
  return "succeeded";
}

function toWebhookType(status: MockStatus):
  | "payment.succeeded"
  | "payment.failed"
  | "payment.cancelled"
  | "payment.expired" {
  if (status === "failed") return "payment.failed";
  if (status === "cancelled") return "payment.cancelled";
  if (status === "expired") return "payment.expired";
  return "payment.succeeded";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session");
  const status = getMockStatus(searchParams.get("status"));

  if (!sessionId) {
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        status: 400,
        detail: "Missing session query parameter",
      },
      { status: 400 }
    );
  }

  const payment = await db.payment.findFirst({
    where: { providerTransactionId: sessionId },
    include: { order: true },
  });

  if (!payment) {
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/not-found",
        title: "Not Found",
        status: 404,
        detail: "Payment session was not found",
      },
      { status: 404 }
    );
  }

  try {
    await processPaymentWebhook({
      eventId: `mock_${randomUUID()}`,
      type: toWebhookType(status),
      occurredAt: new Date().toISOString(),
      data: {
        sessionId,
        transactionId: `txn_${randomUUID()}`,
        amount: Number(payment.amount),
        currency: payment.currency,
      },
    });
  } catch (error: unknown) {
    logger.error("Mock hosted payment flow failed", { error, sessionId, status });
  }

  const appUrl = getPublicAppUrl();
  const redirectUrl = new URL(`/orders/${payment.order.number}`, appUrl);
  redirectUrl.searchParams.set("payment", status);
  return NextResponse.redirect(redirectUrl);
}

