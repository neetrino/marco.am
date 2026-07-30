import { db } from "@white-shop/db";
import type { Prisma } from "@white-shop/db/prisma";
import { getArcaOrderStatus } from "@/lib/payments/arca/client";
import { classifyArcaReconcileOutcome } from "@/lib/payments/arca/classify-status";
import { finalizePaymentFailed, finalizePaymentPaid } from "@/lib/payments/finalize-payment";
import { resolvePaymentReconcileConfig } from "@/lib/payments/reconcile/config";
import { logger } from "@/lib/utils/logger";

const ARCA_PROVIDER = "arca";
const PENDING_PAYMENT_STATUSES = ["pending", "processing"] as const;

export type ReconcilePaymentResult =
  | "paid"
  | "failed"
  | "skipped"
  | "error";

export type ReconcileSummary = {
  scanned: number;
  paid: number;
  failed: number;
  skipped: number;
  errors: number;
  timeoutMinutes: number;
};

type PendingArcaPayment = {
  id: string;
  orderId: string;
  providerTransactionId: string | null;
  createdAt: Date;
  order: {
    id: string;
    number: string;
    userId: string | null;
    paymentStatus: string;
  };
};

/**
 * Polls ArCa for pending payments and finalizes paid / failed / timeout.
 * Idempotent via finalizePaymentPaid / finalizePaymentFailed.
 */
export async function reconcilePendingArcaPayments(
  now: Date = new Date(),
): Promise<ReconcileSummary> {
  const config = resolvePaymentReconcileConfig();
  const timeoutMs = config.timeoutMinutes * 60_000;

  const payments = await db.payment.findMany({
    where: {
      provider: ARCA_PROVIDER,
      status: { in: [...PENDING_PAYMENT_STATUSES] },
      providerTransactionId: { not: null },
      order: { paymentStatus: "pending" },
    },
    take: config.batchSize,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      orderId: true,
      providerTransactionId: true,
      createdAt: true,
      order: {
        select: { id: true, number: true, userId: true, paymentStatus: true },
      },
    },
  });

  const summary: ReconcileSummary = {
    scanned: payments.length,
    paid: 0,
    failed: 0,
    skipped: 0,
    errors: 0,
    timeoutMinutes: config.timeoutMinutes,
  };

  for (const payment of payments) {
    const result = await reconcileOnePayment(payment, now, timeoutMs);
    incrementReconcileSummary(summary, result);
  }

  logger.info("ArCa payment reconcile finished", summary);
  return summary;
}

async function reconcileOnePayment(
  payment: PendingArcaPayment,
  now: Date,
  timeoutMs: number,
): Promise<ReconcilePaymentResult> {
  const bankOrderId = payment.providerTransactionId?.trim() ?? "";
  if (!bankOrderId) {
    return markTimedOutIfNeeded(payment, now, timeoutMs, "Missing bank order id");
  }

  try {
    const status = await getArcaOrderStatus(bankOrderId);
    const outcome = classifyArcaReconcileOutcome(status);

    if (outcome === "paid") {
      return markPaidFromBank(payment, bankOrderId, status.raw as Prisma.InputJsonValue);
    }
    if (outcome === "failed") {
      return markFailedFromBank(payment, bankOrderId, status);
    }

    return markTimedOutIfNeeded(
      payment,
      now,
      timeoutMs,
      "Pending payment exceeded reconcile timeout",
      bankOrderId,
      status.raw as Prisma.InputJsonValue,
    );
  } catch (error) {
    logger.error("ArCa reconcile status check failed", {
      paymentId: payment.id,
      orderId: payment.orderId,
      bankOrderId,
      error,
    });

    const timedOut = await markTimedOutIfNeeded(
      payment,
      now,
      timeoutMs,
      "Bank status check failed after reconcile timeout",
      bankOrderId,
    );
    return timedOut === "failed" ? "failed" : "error";
  }
}

async function markPaidFromBank(
  payment: PendingArcaPayment,
  bankOrderId: string,
  providerResponse: Prisma.InputJsonValue,
): Promise<ReconcilePaymentResult> {
  await finalizePaymentPaid({
    orderId: payment.orderId,
    paymentId: payment.id,
    provider: ARCA_PROVIDER,
    providerTransactionId: bankOrderId,
    providerResponse,
    eventType: "payment_arca_reconcile_paid",
    userId: payment.order.userId,
  });
  return "paid";
}

async function markFailedFromBank(
  payment: PendingArcaPayment,
  bankOrderId: string,
  status: {
    orderStatus: number | null;
    paymentState: string | null;
    raw: Record<string, unknown>;
  },
): Promise<ReconcilePaymentResult> {
  await finalizePaymentFailed({
    orderId: payment.orderId,
    paymentId: payment.id,
    provider: ARCA_PROVIDER,
    providerTransactionId: bankOrderId,
    providerResponse: status.raw as Prisma.InputJsonValue,
    eventType: "payment_arca_reconcile_failed",
    errorCode: status.orderStatus != null ? String(status.orderStatus) : undefined,
    errorMessage: status.paymentState ?? "Bank reported terminal failure",
  });
  return "failed";
}

function incrementReconcileSummary(
  summary: ReconcileSummary,
  result: ReconcilePaymentResult,
): void {
  if (result === "paid") {
    summary.paid += 1;
    return;
  }
  if (result === "failed") {
    summary.failed += 1;
    return;
  }
  if (result === "skipped") {
    summary.skipped += 1;
    return;
  }
  summary.errors += 1;
}

async function markTimedOutIfNeeded(
  payment: PendingArcaPayment,
  now: Date,
  timeoutMs: number,
  errorMessage: string,
  bankOrderId?: string,
  providerResponse?: Prisma.InputJsonValue,
): Promise<ReconcilePaymentResult> {
  const ageMs = now.getTime() - payment.createdAt.getTime();
  if (ageMs < timeoutMs) {
    return "skipped";
  }

  await finalizePaymentFailed({
    orderId: payment.orderId,
    paymentId: payment.id,
    provider: ARCA_PROVIDER,
    providerTransactionId: bankOrderId,
    providerResponse,
    eventType: "payment_arca_reconcile_timeout",
    errorCode: "reconcile_timeout",
    errorMessage,
  });
  return "failed";
}
