import { db } from "@white-shop/db";

import { cartService } from "./cart.service";
import { logger } from "../utils/logger";

/** Why a line from the historical order was not added to the cart. */
export type ReorderSkipReason =
  | "no_variant"
  | "variant_not_found"
  | "unpublished"
  | "out_of_stock";

export type ReorderAddedLine = {
  variantId: string;
  productId: string;
  quantity: number;
};

export type ReorderSkippedLine = {
  variantId: string | null;
  sku: string;
  reason: ReorderSkipReason;
};

/**
 * Adds order lines to the user's cart using current catalog availability (published + stock).
 * Merges quantities with existing cart rows for the same variant (same rules as `POST /cart/items`).
 */
export async function prefillCartFromOrder(
  userId: string,
  orderNumber: string,
  locale: string
): Promise<{
  orderNumber: string;
  added: ReorderAddedLine[];
  skipped: ReorderSkippedLine[];
  cart: Awaited<ReturnType<typeof cartService.getCart>>["cart"];
}> {
  const order = await db.order.findFirst({
    where: { number: orderNumber, userId },
    include: {
      items: { orderBy: { id: "asc" } },
    },
  });

  if (!order) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Order not found",
      detail: `Order with number '${orderNumber}' not found`,
    };
  }

  if (order.items.length === 0) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation failed",
      detail: "Order has no line items to reorder",
    };
  }

  const added: ReorderAddedLine[] = [];
  const skipped: ReorderSkippedLine[] = [];

  let cartState = await db.cart.findFirst({
    where: { userId },
    include: { items: true },
  });

  for (const line of order.items) {
    if (!line.variantId) {
      skipped.push({ variantId: null, sku: line.sku, reason: "no_variant" });
      continue;
    }

    const variant = await db.productVariant.findUnique({
      where: { id: line.variantId },
      select: {
        id: true,
        productId: true,
        published: true,
        stock: true,
      },
    });

    if (!variant) {
      skipped.push({ variantId: line.variantId, sku: line.sku, reason: "variant_not_found" });
      continue;
    }

    if (!variant.published) {
      skipped.push({ variantId: line.variantId, sku: line.sku, reason: "unpublished" });
      continue;
    }

    const existingQty =
      cartState?.items.find((i: { variantId: string }) => i.variantId === line.variantId)?.quantity ?? 0;
    const qtyToAdd = Math.min(line.quantity, Math.max(0, variant.stock - existingQty));

    if (qtyToAdd <= 0) {
      skipped.push({ variantId: line.variantId, sku: line.sku, reason: "out_of_stock" });
      continue;
    }

    await cartService.addItem(
      userId,
      { variantId: line.variantId, productId: variant.productId, quantity: qtyToAdd },
      locale
    );
    added.push({
      variantId: line.variantId,
      productId: variant.productId,
      quantity: qtyToAdd,
    });

    cartState = await db.cart.findFirst({
      where: { userId },
      include: { items: true },
    });
  }

  logger.info("Cart reorder from order completed", {
    userId,
    orderNumber: order.number,
    addedCount: added.length,
    skippedCount: skipped.length,
  });

  const { cart } = await cartService.getCart(userId, locale);
  return {
    orderNumber: order.number,
    added,
    skipped,
    cart,
  };
}
