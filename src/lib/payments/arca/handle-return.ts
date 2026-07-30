import { db } from "@white-shop/db";
import type { Prisma } from "@white-shop/db/prisma";
import { finalizePaymentFailed, finalizePaymentPaid } from "@/lib/payments/finalize-payment";
import { getArcaOrderStatus } from "@/lib/payments/arca/client";
import {
  buildOrderFailedRedirectUrl,
  buildOrderPaidRedirectUrl,
} from "@/lib/payments/payment-urls";
import { logger } from "@/lib/utils/logger";

const PROVIDER = "arca";

/**
 * Handles browser return from IDBank / ArCa. Verifies status via bank API.
 */
export async function handleArcaReturn(params: {
  bankOrderId: string | null;
}): Promise<{ redirectUrl: string }> {
  const bankOrderId = params.bankOrderId?.trim() || null;
  if (!bankOrderId) {
    return { redirectUrl: buildOrderFailedRedirectUrl(null) };
  }

  const payment = await db.payment.findFirst({
    where: { provider: PROVIDER, providerTransactionId: bankOrderId },
    include: { order: { select: { id: true, number: true, userId: true, paymentStatus: true } } },
  });

  if (!payment) {
    logger.warn("ArCa return: payment not found", { bankOrderId });
    return { redirectUrl: buildOrderFailedRedirectUrl(null) };
  }

  let status;
  try {
    status = await getArcaOrderStatus(bankOrderId);
  } catch (error) {
    logger.error("ArCa status check failed on return", { bankOrderId, error });
    return { redirectUrl: buildOrderFailedRedirectUrl(payment.order.number) };
  }

  if (status.isPaid) {
    await finalizePaymentPaid({
      orderId: payment.orderId,
      paymentId: payment.id,
      provider: PROVIDER,
      providerTransactionId: bankOrderId,
      providerResponse: status.raw as Prisma.InputJsonValue,
      eventType: "payment_arca_paid",
      userId: payment.order.userId,
    });
    return { redirectUrl: buildOrderPaidRedirectUrl(payment.order.number) };
  }

  await finalizePaymentFailed({
    orderId: payment.orderId,
    paymentId: payment.id,
    provider: PROVIDER,
    providerTransactionId: bankOrderId,
    providerResponse: status.raw as Prisma.InputJsonValue,
    eventType: "payment_arca_failed",
    errorCode: status.orderStatus != null ? String(status.orderStatus) : undefined,
    errorMessage: status.paymentState ?? "Payment not deposited",
  });

  return { redirectUrl: buildOrderFailedRedirectUrl(payment.order.number) };
}

/** Fail URL handler — marks pending payment failed when bankOrderId is known. */
export async function handleArcaFail(params: {
  bankOrderId: string | null;
}): Promise<{ redirectUrl: string }> {
  const bankOrderId = params.bankOrderId?.trim() || null;
  if (!bankOrderId) {
    return { redirectUrl: buildOrderFailedRedirectUrl(null) };
  }

  const payment = await db.payment.findFirst({
    where: { provider: PROVIDER, providerTransactionId: bankOrderId },
    include: { order: { select: { number: true } } },
  });

  if (payment) {
    await finalizePaymentFailed({
      orderId: payment.orderId,
      paymentId: payment.id,
      provider: PROVIDER,
      providerTransactionId: bankOrderId,
      eventType: "payment_arca_failed",
      errorMessage: "Customer returned via fail URL",
    });
    return { redirectUrl: buildOrderFailedRedirectUrl(payment.order.number) };
  }

  return { redirectUrl: buildOrderFailedRedirectUrl(null) };
}
