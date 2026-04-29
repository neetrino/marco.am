import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";

export type MarkPaidResult =
  | { ok: true; orderNumber: string; alreadyPaid: boolean }
  | { ok: false; reason: "payment_not_found" };

/**
 * Confirms online payment: idempotent; clears logged-in user cart when newly marked paid.
 */
export async function markOrderPaymentPaid(input: {
  paymentId: string;
  providerTransactionId: string;
  providerResponse?: unknown;
  cardLast4?: string | null;
  cardBrand?: string | null;
}): Promise<MarkPaidResult> {
  try {
    const out = await db.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: input.paymentId },
        include: { order: true },
      });

      if (!payment) {
        return { ok: false as const, reason: "payment_not_found" as const };
      }

      if (payment.order.paymentStatus === "paid") {
        return {
          ok: true as const,
          orderNumber: payment.order.number,
          alreadyPaid: true,
        };
      }

      const now = new Date();

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "paid",
          providerTransactionId: input.providerTransactionId,
          completedAt: now,
          ...(input.providerResponse !== undefined
            ? { providerResponse: input.providerResponse as object }
            : {}),
          ...(input.cardLast4 ? { cardLast4: input.cardLast4 } : {}),
          ...(input.cardBrand ? { cardBrand: input.cardBrand } : {}),
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: "paid",
          status: payment.order.status === "pending" ? "processing" : payment.order.status,
          paidAt: now,
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId: payment.orderId,
          type: "payment_completed",
          data: {
            paymentId: payment.id,
            providerTransactionId: input.providerTransactionId,
          },
        },
      });

      if (payment.order.userId) {
        await tx.cart.deleteMany({
          where: { userId: payment.order.userId },
        });
      }

      return {
        ok: true as const,
        orderNumber: payment.order.number,
        alreadyPaid: false,
      };
    });

    if (!out.ok) {
      return { ok: false, reason: "payment_not_found" };
    }
    return { ok: true, orderNumber: out.orderNumber, alreadyPaid: out.alreadyPaid };
  } catch (error: unknown) {
    logger.error("markOrderPaymentPaid failed", { error, paymentId: input.paymentId });
    throw error;
  }
}

export async function markOrderPaymentFailed(input: {
  paymentId: string;
  errorMessage?: string;
  providerResponse?: unknown;
}): Promise<void> {
  const now = new Date();
  await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: input.paymentId },
      include: { order: true },
    });
    if (!payment || payment.order.paymentStatus === "paid") {
      return;
    }

    await tx.payment.update({
      where: { id: input.paymentId },
      data: {
        status: "failed",
        failedAt: now,
        errorMessage: input.errorMessage ?? "Payment declined",
        ...(input.providerResponse !== undefined
          ? { providerResponse: input.providerResponse as object }
          : {}),
      },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: "failed",
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: payment.orderId,
        type: "payment_failed",
        data: {
          paymentId: input.paymentId,
          message: input.errorMessage,
        },
      },
    });
  });
}
