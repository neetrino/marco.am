import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { db } from "@white-shop/db";

/** Tolerance for decimal/float comparison on payment amounts (AMD). */
const PAYMENT_AMOUNT_TOLERANCE = 0.01;


const webhookPayloadSchema = z.object({
  eventId: z.string().min(1),
  type: z.enum([
    "payment.processing",
    "payment.succeeded",
    "payment.failed",
    "payment.cancelled",
    "payment.expired",
  ]),
  occurredAt: z.string().datetime().optional(),
  data: z.object({
    sessionId: z.string().min(1),
    transactionId: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    currency: z.string().min(3).max(8).optional(),
    errorCode: z.string().min(1).optional(),
    errorMessage: z.string().min(1).optional(),
    cardLast4: z
      .string()
      .regex(/^\d{4}$/)
      .optional(),
    cardBrand: z.string().min(1).optional(),
  }),
});

type PaymentWebhookPayload = z.infer<typeof webhookPayloadSchema>;



type WebhookTransition = {
  paymentStatus: string;
  orderPaymentStatus: string;
  shouldMarkPaid: boolean;
  shouldMarkFailed: boolean;
};

const webhookTransitions: Record<PaymentWebhookPayload["type"], WebhookTransition> = {
  "payment.processing": {
    paymentStatus: "processing",
    orderPaymentStatus: "pending",
    shouldMarkPaid: false,
    shouldMarkFailed: false,
  },
  "payment.succeeded": {
    paymentStatus: "paid",
    orderPaymentStatus: "paid",
    shouldMarkPaid: true,
    shouldMarkFailed: false,
  },
  "payment.failed": {
    paymentStatus: "failed",
    orderPaymentStatus: "failed",
    shouldMarkPaid: false,
    shouldMarkFailed: true,
  },
  "payment.cancelled": {
    paymentStatus: "cancelled",
    orderPaymentStatus: "failed",
    shouldMarkPaid: false,
    shouldMarkFailed: true,
  },
  "payment.expired": {
    paymentStatus: "expired",
    orderPaymentStatus: "failed",
    shouldMarkPaid: false,
    shouldMarkFailed: true,
  },
};




function toPaymentAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

/**
 * Ensures `payment.succeeded` webhooks include amount/currency matching the stored payment.
 */
export function assertWebhookPaymentAmountMatches(
  event: PaymentWebhookPayload,
  payment: { amount: unknown; currency: string }
): void {
  if (event.type !== "payment.succeeded") {
    return;
  }

  if (event.data.amount === undefined) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "payment.succeeded webhook must include data.amount",
    };
  }

  if (!event.data.currency) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "payment.succeeded webhook must include data.currency",
    };
  }

  const expectedAmount = toPaymentAmount(payment.amount);
  if (
    !Number.isFinite(expectedAmount) ||
    Math.abs(event.data.amount - expectedAmount) > PAYMENT_AMOUNT_TOLERANCE
  ) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Webhook amount does not match payment record",
    };
  }

  if (event.data.currency.toUpperCase() !== payment.currency.toUpperCase()) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Webhook currency does not match payment record",
    };
  }
}

function parseWebhookPayload(rawPayload: unknown): PaymentWebhookPayload {
  const parsed = webhookPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation Error",
      detail: "Invalid PSP webhook payload",
    };
  }
  return parsed.data;
}

export function computeWebhookSignature(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = computeWebhookSignature(rawBody, secret);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature.trim(), "hex");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function processPaymentWebhook(
  payload: unknown
): Promise<{ processed: boolean; duplicate?: boolean }> {
  const event = parseWebhookPayload(payload);

  const payment = await db.payment.findFirst({
    where: { providerTransactionId: event.data.sessionId },
    include: { order: true },
  });

  if (!payment) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Not Found",
      detail: "Payment session was not found",
    };
  }

  assertWebhookPaymentAmountMatches(event, payment);

  const transition = webhookTransitions[event.type];
  const now = new Date();
  const nextOrderStatus =
    transition.shouldMarkPaid && payment.order.status === "pending"
      ? "processing"
      : payment.order.status;

  let duplicate = false;

  await db.$transaction(async (tx) => {
    const existingWebhook = await tx.orderEvent.findFirst({
      where: {
        type: "payment_webhook_processed",
        data: {
          path: ["eventId"],
          equals: event.eventId,
        },
      },
      select: { id: true },
    });

    if (existingWebhook) {
      duplicate = true;
      return;
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: transition.paymentStatus,
        providerResponse: {
          webhookEventId: event.eventId,
          webhookType: event.type,
          ...(event.occurredAt ? { occurredAt: event.occurredAt } : {}),
          data: event.data,
        },
        errorCode: event.data.errorCode,
        errorMessage: event.data.errorMessage,
        cardLast4: event.data.cardLast4,
        cardBrand: event.data.cardBrand,
        completedAt: transition.shouldMarkPaid ? now : undefined,
        failedAt: transition.shouldMarkFailed ? now : undefined,
      },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: transition.orderPaymentStatus,
        status: nextOrderStatus,
        paidAt: transition.shouldMarkPaid ? now : undefined,
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: payment.orderId,
        type: "payment_webhook_processed",
        data: {
          eventId: event.eventId,
          eventType: event.type,
          providerTransactionId: event.data.sessionId,
          paymentStatus: transition.paymentStatus,
          orderPaymentStatus: transition.orderPaymentStatus,
        },
      },
    });
  });

  if (duplicate) {
    return { processed: true, duplicate: true };
  }

  return { processed: true };
}

