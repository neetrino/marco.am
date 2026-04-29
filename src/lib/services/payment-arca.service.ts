import { db } from "@white-shop/db";
import { buildArcaReturnUrl } from "@/lib/payments/arca/config";
import {
  arcaGetOrderStatusExtended,
  arcaRegisterOrder,
  extractMaskedPan,
  isArcaDepositSuccess,
} from "@/lib/payments/arca/client";
import { logger } from "@/lib/utils/logger";
import { markOrderPaymentFailed, markOrderPaymentPaid } from "./payment-order-completion.service";

type SessionInput = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  checkoutLocale: string;
};

type SessionResult = {
  provider: string;
  paymentUrl: string;
  expiresAt: string;
};

export async function createArcaPaymentSession(input: SessionInput): Promise<SessionResult> {
  const returnUrl = buildArcaReturnUrl(input.orderId);
  const description = `Order ${input.orderNumber}`;

  const { orderId, formUrl } = await arcaRegisterOrder({
    orderNumber: input.orderNumber,
    amount: input.amount,
    currency: input.currency,
    returnUrl,
    description,
    language: input.checkoutLocale,
  });

  await db.payment.update({
    where: { id: input.paymentId },
    data: {
      provider: "arca",
      providerTransactionId: orderId,
      status: "pending",
      providerResponse: {
        arcaOrderId: orderId,
        formUrl,
        returnUrl,
      },
    },
  });

  await db.orderEvent.create({
    data: {
      orderId: input.orderId,
      type: "payment_session_created",
      data: {
        provider: "arca",
        paymentId: input.paymentId,
        arcaOrderId: orderId,
      },
    },
  });

  return {
    provider: "arca",
    paymentUrl: formUrl,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
}

export async function handleArcaCallbackGet(localOrderId: string, arcaOrderIdFromQuery: string | null) {
  const order = await db.order.findFirst({
    where: { id: localOrderId },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!order || order.payments.length === 0) {
    logger.warn("Arca callback: order or payment not found", { localOrderId });
    return { redirectPath: "/checkout?payment=error" as const };
  }

  if (order.paymentStatus === "paid") {
    return { redirectPath: `/orders/${order.number}?payment=success` as const };
  }

  const payment =
    order.payments.find((p) => p.provider === "arca" && p.status === "pending") ??
    order.payments.find((p) => p.provider === "arca");
  if (!payment || payment.provider !== "arca") {
    return { redirectPath: `/orders/${order.number}?payment=error` as const };
  }

  const arcaOrderId = arcaOrderIdFromQuery ?? payment.providerTransactionId;
  if (!arcaOrderId) {
    return { redirectPath: `/orders/${order.number}?payment=error` as const };
  }

  if (payment.providerTransactionId && payment.providerTransactionId !== arcaOrderId) {
    logger.warn("Arca callback orderId mismatch", {
      localOrderId,
      stored: payment.providerTransactionId,
      query: arcaOrderIdFromQuery,
    });
    return { redirectPath: `/orders/${order.number}?payment=error` as const };
  }

  let statusJson: unknown;
  try {
    statusJson = await arcaGetOrderStatusExtended(arcaOrderId);
  } catch (error: unknown) {
    logger.error("Arca getOrderStatusExtended failed", { error, arcaOrderId });
    return { redirectPath: `/orders/${order.number}?payment=pending` as const };
  }

  const data = statusJson as import("@/lib/payments/arca/types").ArcaExtendedStatusResponse;

  if (isArcaDepositSuccess(data)) {
    const last4 = extractMaskedPan(data);
    const result = await markOrderPaymentPaid({
      paymentId: payment.id,
      providerTransactionId: arcaOrderId,
      providerResponse: data,
      cardLast4: last4 ?? null,
    });
    if (result.ok) {
      return { redirectPath: `/orders/${result.orderNumber}?payment=success` as const };
    }
    return { redirectPath: "/checkout?payment=error" as const };
  }

  await markOrderPaymentFailed({
    paymentId: payment.id,
    errorMessage: typeof data.errorMessage === "string" ? data.errorMessage : "Arca payment not deposited",
    providerResponse: data,
  });

  return { redirectPath: `/orders/${order.number}?payment=failed` as const };
}
