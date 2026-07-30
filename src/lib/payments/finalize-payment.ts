import { db } from "@white-shop/db";
import type { Prisma } from "@white-shop/db/prisma";
import { logger } from "@/lib/utils/logger";

const PAID_PAYMENT_STATUS = "paid";
const FAILED_PAYMENT_STATUS = "failed";
const PROCESSING_ORDER_STATUS = "processing";

type FinalizeContext = {
  orderId: string;
  paymentId: string;
  provider: string;
  providerTransactionId?: string;
  providerResponse?: Prisma.InputJsonValue;
  eventType: string;
  userId?: string | null;
};

/**
 * Marks order + payment as paid (idempotent). Clears cart for logged-in buyers.
 */
export async function finalizePaymentPaid(ctx: FinalizeContext): Promise<{ alreadyPaid: boolean }> {
  const now = new Date();
  let alreadyPaid = false;

  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: ctx.orderId },
      select: { id: true, paymentStatus: true, status: true, userId: true },
    });
    if (!order) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Not Found",
        detail: "Order not found for payment finalization",
      };
    }

    if (order.paymentStatus === PAID_PAYMENT_STATUS) {
      alreadyPaid = true;
      return;
    }

    await tx.payment.update({
      where: { id: ctx.paymentId },
      data: {
        status: PAID_PAYMENT_STATUS,
        providerTransactionId: ctx.providerTransactionId,
        providerResponse: ctx.providerResponse,
        completedAt: now,
        failedAt: null,
        errorCode: null,
        errorMessage: null,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PAID_PAYMENT_STATUS,
        status: order.status === "pending" ? PROCESSING_ORDER_STATUS : order.status,
        paidAt: now,
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: ctx.eventType,
        data: {
          provider: ctx.provider,
          outcome: "paid",
          providerTransactionId: ctx.providerTransactionId ?? null,
        },
      },
    });

    const userId = ctx.userId ?? order.userId;
    if (userId) {
      await tx.cart.deleteMany({ where: { userId } });
    }
  });

  if (!alreadyPaid) {
    logger.info("Payment marked paid", {
      orderId: ctx.orderId,
      paymentId: ctx.paymentId,
      provider: ctx.provider,
    });
  }

  return { alreadyPaid };
}

/**
 * Marks order + payment as failed (no-op if already paid).
 */
export async function finalizePaymentFailed(ctx: FinalizeContext & {
  errorCode?: string;
  errorMessage?: string;
}): Promise<{ ignoredBecausePaid: boolean }> {
  const now = new Date();
  let ignoredBecausePaid = false;

  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: ctx.orderId },
      select: { id: true, paymentStatus: true },
    });
    if (!order) {
      return;
    }
    if (order.paymentStatus === PAID_PAYMENT_STATUS) {
      ignoredBecausePaid = true;
      return;
    }

    await tx.payment.update({
      where: { id: ctx.paymentId },
      data: {
        status: FAILED_PAYMENT_STATUS,
        providerTransactionId: ctx.providerTransactionId,
        providerResponse: ctx.providerResponse,
        errorCode: ctx.errorCode,
        errorMessage: ctx.errorMessage,
        failedAt: now,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: FAILED_PAYMENT_STATUS },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: ctx.eventType,
        data: {
          provider: ctx.provider,
          outcome: "failed",
          errorCode: ctx.errorCode ?? null,
          errorMessage: ctx.errorMessage ?? null,
        },
      },
    });
  });

  return { ignoredBecausePaid };
}
