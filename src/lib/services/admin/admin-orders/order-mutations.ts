import { db } from "@white-shop/db";
import { logger } from "../../../utils/logger";
import type { UpdateOrderContext, UpdateOrderData } from "./types";
import { getOrderById } from "./order-operations";
import {
  assertValidAdminNotesUpdate,
  assertValidOrderUpdateData,
  buildOrderUpdatePatch,
} from "./order-update-patch";
import type { Order } from "@prisma/client";
import {
  buildCashPaymentPatch,
  isCashPaymentMethod,
  resolveCashOrderPaymentStatus,
} from "./cash-payment-flow";

function rethrowUpdateOrderFailure(orderId: string, error: unknown): never {
  if (error && typeof error === "object" && "status" in error && "type" in error) {
    throw error;
  }

  const errorObj = error as {
    name?: string;
    message?: string;
    code?: string;
    meta?: { cause?: string };
    stack?: string;
  };
  logger.error("updateOrder error", {
    orderId,
    error: {
      name: errorObj?.name,
      message: errorObj?.message,
      code: errorObj?.code,
      meta: errorObj?.meta,
      stack: errorObj?.stack?.substring(0, 500),
    },
  });

  if (errorObj?.code === "P2025") {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Not Found",
      detail: errorObj?.meta?.cause || "The requested order was not found",
    };
  }

  throw {
    status: 500,
    type: "https://api.shop.am/problems/internal-error",
    title: "Database Error",
    detail: errorObj?.message || "An error occurred while updating the order",
  };
}

async function persistOrderUpdate(
  orderId: string,
  existing: Pick<Order, "status" | "paymentStatus" | "fulfillmentStatus" | "adminNotes">,
  payment: { id: string; method: string | null; provider: string | null } | null,
  data: UpdateOrderData,
  context?: UpdateOrderContext
) {
  const resolvedData: UpdateOrderData = {
    ...data,
    paymentStatus: resolveCashOrderPaymentStatus({
      paymentMethod: payment?.method,
      paymentProvider: payment?.provider,
      requestedStatus: data.status,
      requestedPaymentStatus: data.paymentStatus,
      existingPaymentStatus: existing.paymentStatus,
    }),
  };

  assertValidOrderUpdateData(resolvedData);
  assertValidAdminNotesUpdate(resolvedData);

  const patch = buildOrderUpdatePatch(
    {
      status: existing.status,
      paymentStatus: existing.paymentStatus,
      fulfillmentStatus: existing.fulfillmentStatus,
      adminNotes: existing.adminNotes,
    },
    resolvedData
  );

  if (!patch) {
    return getOrderById(orderId);
  }

  const { updateData, changes } = patch;
  const updatedFieldKeys = Object.keys(updateData);

  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: updateData,
    });

    if (
      payment &&
      isCashPaymentMethod(payment.method ?? payment.provider) &&
      typeof updateData.paymentStatus === "string"
    ) {
      const cashPaymentPatch = buildCashPaymentPatch(updateData.paymentStatus);
      if (cashPaymentPatch) {
        await tx.payment.update({
          where: { id: payment.id },
          data: cashPaymentPatch,
        });
      }
    }

    await tx.orderEvent.create({
      data: {
        orderId,
        type: "order_updated",
        userId: context?.actorUserId ?? undefined,
        data: {
          changes,
          updatedFields: updatedFieldKeys,
        },
      },
    });
  });

  return getOrderById(orderId);
}

/**
 * Delete order
 * Հեռացնում է պատվերը և բոլոր կապված գրառումները (cascade)
 */
export async function deleteOrder(orderId: string) {
  try {
    logger.info('Starting order deletion', { orderId });
    
    // Ստուգում ենք, արդյոք պատվերը գոյություն ունի
    const existing = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        _count: {
          select: {
            items: true,
            payments: true,
            events: true,
          },
        },
      },
    });

    if (!existing) {
      logger.warn('Order not found', { orderId });
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Order not found",
        detail: `Order with id '${orderId}' does not exist`,
      };
    }

    logger.info('Order found', {
      id: existing.id,
      number: existing.number,
      status: existing.status,
      total: existing.total,
      itemsCount: existing._count.items,
      paymentsCount: existing._count.payments,
      eventsCount: existing._count.events,
    });

    // Հեռացնում ենք պատվերը (cascade-ը ավտոմատ կհեռացնի կապված items, payments, events)
    try {
      await db.order.delete({
        where: { id: orderId },
      });
      logger.info('Order deleted successfully', { orderId, orderNumber: existing.number });
    } catch (deleteError: unknown) {
      const errorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError);
      const errorCode = deleteError && typeof deleteError === 'object' && 'code' in deleteError ? String(deleteError.code) : '';
      logger.error('Prisma delete error', {
        code: errorCode,
        message: errorMessage,
      });
      throw deleteError;
    }
    
    return { success: true };
  } catch (error: unknown) {
    // Եթե սա մեր ստեղծած սխալ է, ապա վերադարձնում ենք այն
    if (error && typeof error === 'object' && 'status' in error && 'type' in error) {
      logger.error('Standard error', {
        status: (error as { status: number }).status,
        type: (error as { type: string }).type,
        title: (error as { title?: string }).title,
        detail: (error as { detail?: string }).detail,
      });
      throw error;
    }

    // Մանրամասն լոգավորում Prisma սխալների համար
    const errorObj = error as { name?: string; message?: string; code?: string; meta?: unknown; stack?: string };
    logger.error('Order deletion error', {
      orderId,
      error: {
        name: errorObj?.name,
        message: errorObj?.message,
        code: errorObj?.code,
        meta: errorObj?.meta,
        stack: errorObj?.stack?.substring(0, 500),
      },
    });

    // Prisma սխալների մշակում
    if (errorObj?.code === 'P2025') {
      // Record not found
      logger.warn('Prisma P2025: Record not found');
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Order not found",
        detail: `Order with id '${orderId}' does not exist`,
      };
    }

    if (errorObj?.code === 'P2003') {
      // Foreign key constraint failed
      logger.warn('Prisma P2003: Foreign key constraint');
      throw {
        status: 409,
        type: "https://api.shop.am/problems/conflict",
        title: "Cannot delete order",
        detail: "Order has related records that cannot be deleted",
      };
    }

    // Գեներիկ սխալ
    throw {
      status: 500,
      type: "https://api.shop.am/problems/internal-error",
      title: "Internal Server Error",
      detail: errorObj?.message || "Failed to delete order",
    };
  }
}

/**
 * Update order — persists only changed fields; writes `order_events` with actor and change log.
 */
export async function updateOrder(
  orderId: string,
  data: UpdateOrderData,
  context?: UpdateOrderContext
) {
  try {
    const existing = await db.order.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          select: {
            id: true,
            method: true,
            provider: true,
          },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!existing) {
      throw {
        status: 404,
        type: "https://api.shop.am/problems/not-found",
        title: "Order not found",
        detail: `Order with id '${orderId}' does not exist`,
      };
    }

    return await persistOrderUpdate(
      orderId,
      existing,
      existing.payments[0] ?? null,
      data,
      context
    );
  } catch (error: unknown) {
    rethrowUpdateOrderFailure(orderId, error);
  }
}




