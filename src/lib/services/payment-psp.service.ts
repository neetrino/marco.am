import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { z } from "zod";
import { db } from "@white-shop/db";
import { getPublicAppUrl } from "../config/deployment-env";

const DEFAULT_SESSION_TTL_MS = 15 * 60 * 1000;

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

export type PaymentWebhookPayload = z.infer<typeof webhookPayloadSchema>;

type SessionInput = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
};

type SessionResult = {
  provider: string;
  sessionId: string;
  paymentUrl: string;
  expiresAt: string;
};

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

function getProvider(): string {
  const raw = process.env.PAYMENT_PSP_PROVIDER?.trim();
  if (!raw) {
    return "mock_psp";
  }
  return raw.toLowerCase();
}

function getSessionTtlMs(): number {
  const raw = Number(process.env.PAYMENT_PSP_SESSION_TTL_MS ?? DEFAULT_SESSION_TTL_MS);
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_SESSION_TTL_MS;
  }
  return Math.floor(raw);
}

function buildPaymentUrl(sessionId: string, orderNumber: string): string {
  const base =
    process.env.PAYMENT_PSP_CHECKOUT_BASE_URL?.trim() ||
    `${getPublicAppUrl()}/api/v1/payments/mock-hosted`;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}session=${encodeURIComponent(sessionId)}&order=${encodeURIComponent(
    orderNumber
  )}`;
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

export async function createCardPaymentSession(input: SessionInput): Promise<SessionResult> {
  const provider = getProvider();
  const sessionId = `psp_${randomUUID().replace(/-/g, "")}`;
  const expiresAt = new Date(Date.now() + getSessionTtlMs());
  const paymentUrl = buildPaymentUrl(sessionId, input.orderNumber);
  const idempotencyKey = `${input.orderNumber}:${sessionId}`;

  await db.payment.update({
    where: { id: input.paymentId },
    data: {
      provider,
      providerTransactionId: sessionId,
      idempotencyKey,
      status: "processing",
      providerResponse: {
        sessionId,
        paymentUrl,
        expiresAt: expiresAt.toISOString(),
        amount: input.amount,
        currency: input.currency,
      },
    },
  });

  await db.orderEvent.create({
    data: {
      orderId: input.orderId,
      type: "payment_session_created",
      data: {
        provider,
        paymentId: input.paymentId,
        sessionId,
        paymentUrl,
        expiresAt: expiresAt.toISOString(),
      },
    },
  });

  return {
    provider,
    sessionId,
    paymentUrl,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function processPaymentWebhook(payload: unknown): Promise<{ processed: boolean }> {
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

  const transition = webhookTransitions[event.type];
  const now = new Date();
  const nextOrderStatus =
    transition.shouldMarkPaid && payment.order.status === "pending"
      ? "processing"
      : payment.order.status;

  await db.$transaction(async (tx) => {
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

  return { processed: true };
}

