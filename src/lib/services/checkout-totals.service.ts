import { normalizeShippingMethod } from "../constants/shipping-method";
import { logger } from "../utils/logger";
import type { CheckoutTotalsResponse } from "../types/checkout-totals";
import { adminDeliveryService } from "./admin/admin-delivery.service";
import { cartService } from "./cart.service";
import {
  resolveGuestCheckoutItems,
  type GuestCheckoutItemInput,
} from "./checkout-guest-items.service";
import { shouldChargeCourierShipping } from "./checkout-delivery-rules.service";
import { resolveProductClass } from "../constants/product-class";
import { promoCodesService } from "./promo-codes.service";

type AuthenticatedCartItem = {
  productClass: string;
};

function extractCartItemProductClasses(items: AuthenticatedCartItem[]): string[] {
  return items.map((item) => resolveProductClass(item.productClass));
}

type ComputeCheckoutTotalsInput = {
  userId?: string;
  locale: string;
  cartId?: string;
  guestItems?: GuestCheckoutItemInput[];
  couponCode?: string;
  customerEmail?: string;
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
    let appliedCouponCode = input.couponCode;
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
      productClasses = extractCartItemProductClasses(
        cart.items.map((item) => ({
          productClass: item.productClass,
        })),
      );
      if (!appliedCouponCode) {
        appliedCouponCode = cart.couponCode ?? undefined;
      }
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

    const promoDiscount = await promoCodesService.resolveDiscount({
      couponCode: appliedCouponCode,
      subtotal,
      userId: input.userId,
      customerEmail: input.customerEmail,
      productClasses,
    });
    const discountAmount = promoDiscount.discountAmount;
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
