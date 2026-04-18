import { normalizeShippingMethod } from "../constants/shipping-method";
import { logger } from "../utils/logger";
import type { CheckoutTotalsResponse } from "../types/checkout-totals";
import { adminDeliveryService } from "./admin/admin-delivery.service";
import { cartService } from "./cart.service";
import { db } from "@white-shop/db";
import {
  resolveGuestCheckoutItems,
  type GuestCheckoutItemInput,
} from "./checkout-guest-items.service";
import { shouldChargeCourierShipping } from "./checkout-delivery-rules.service";
import { resolveProductClass } from "../constants/product-class";

export type ComputeCheckoutTotalsInput = {
  userId?: string;
  locale: string;
  cartId?: string;
  guestItems?: GuestCheckoutItemInput[];
  shippingMethod: string;
  city?: string;
  country?: string;
};

class CheckoutTotalsService {
  /**
   * Server-side subtotal + shipping + total (matches checkout order computation; cart uses pricing rules from getCart).
   */
  async compute(input: ComputeCheckoutTotalsInput): Promise<CheckoutTotalsResponse> {
    const shippingMethod = normalizeShippingMethod(input.shippingMethod);
    const country = (input.country ?? "Armenia").trim();
    const city = input.city?.trim();

    let subtotal = 0;
    let productClasses: string[] = [];

    if (input.userId) {
      const { cart } = await cartService.getCart(input.userId, input.locale);
      if (input.cartId && cart.id !== input.cartId) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          detail: "cartId does not match the current user's cart",
        };
      }
      if (cart.items.length === 0) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Cart is empty",
          detail: "Cannot compute totals for an empty cart",
        };
      }
      subtotal = cart.totals.subtotal;
      const rawCart = await db.cart.findFirst({
        where: { id: cart.id, userId: input.userId },
        select: {
          items: {
            select: {
              variant: { select: { productClass: true } },
              product: { select: { productClass: true } },
            },
          },
        },
      });
      productClasses = (rawCart?.items ?? []).map((item) =>
        resolveProductClass(item.variant?.productClass ?? item.product?.productClass)
      );
    } else if (input.guestItems && input.guestItems.length > 0) {
      const guestItems = await resolveGuestCheckoutItems(input.guestItems, input.locale);
      subtotal = guestItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      productClasses = guestItems.map((item) => item.productClass);
    } else {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation Error",
        detail: "Authenticated cart or guest items array is required",
      };
    }

    const discountAmount = 0;
    let shippingAmount = 0;
    const shouldChargeShipping = shouldChargeCourierShipping(productClasses);
    if (shippingMethod === "courier" && city && shouldChargeShipping) {
      shippingAmount = await adminDeliveryService.getDeliveryPrice(city, country);
      if (shippingAmount < 0) {
        shippingAmount = 0;
      }
    }
    const taxAmount = 0;
    const total = subtotal - discountAmount + shippingAmount + taxAmount;

    logger.debug("Checkout totals computed", {
      subtotal,
      shippingAmount,
      total,
      shippingMethod,
      shouldChargeShipping,
    });

    return {
      currency: "AMD",
      subtotal,
      discountAmount,
      shippingAmount,
      taxAmount,
      total,
    };
  }
}

export const checkoutTotalsService = new CheckoutTotalsService();
