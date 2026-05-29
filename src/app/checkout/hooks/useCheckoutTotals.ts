import { useState, useEffect, useRef } from "react";
import { apiClient } from "../../../lib/api-client";
import { getClientErrorDetail } from "../../../lib/api-client/types";
import type { CheckoutTotalsResponse } from "../../../lib/types/checkout-totals";
import { logger } from "../../../lib/utils/logger";
import { isCourierShipping, type ShippingMethodId } from "../../../lib/constants/shipping-method";
import type { Cart, CartItem } from "../types";

const DEBOUNCE_MS = 400;

function buildGuestPayloadItems(cart: Cart) {
  return cart.items.map((item: CartItem) => ({
    productId: item.variant.product.id,
    variantId: item.variant.id,
    quantity: item.quantity,
  }));
}

export function useCheckoutTotals(
  cart: Cart | null,
  isLoggedIn: boolean,
  shippingMethod: ShippingMethodId,
  shippingCity: string | undefined,
  couponCode?: string | null,
  customerEmail?: string
) {
  const [totals, setTotals] = useState<CheckoutTotalsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [staleAfterError, setStaleAfterError] = useState(false);
  const lastGoodRef = useRef<CheckoutTotalsResponse | null>(null);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      setTotals(null);
      setStaleAfterError(false);
      lastGoodRef.current = null;
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const body: Record<string, unknown> = {
          shippingMethod,
          country: "Armenia",
        };
        if (isCourierShipping(shippingMethod) && shippingCity?.trim()) {
          body.city = shippingCity.trim();
        }

        if (isLoggedIn && cart.id !== "guest-cart") {
          body.cartId = cart.id;
        } else {
          body.items = buildGuestPayloadItems(cart);
        }

        if (couponCode?.trim()) {
          body.couponCode = couponCode.trim().toUpperCase();
        }
        if (!isLoggedIn && customerEmail?.trim()) {
          body.customerEmail = customerEmail.trim();
        }

        const response = await apiClient.post<CheckoutTotalsResponse>(
          "/api/v1/checkout/totals",
          body
        );
        setTotals(response);
        lastGoodRef.current = response;
        setStaleAfterError(false);
      } catch (err: unknown) {
        const detail = getClientErrorDetail(err);
        logger.warn("Checkout totals request failed", {
          detail: detail ?? String(err),
        });
        const previous = lastGoodRef.current;
        setTotals(previous);
        setStaleAfterError(previous !== null);
      } finally {
        setLoading(false);
      }
    };

    const id = window.setTimeout(run, DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [cart, isLoggedIn, shippingMethod, shippingCity, couponCode, customerEmail]);

  const displayTotals = totals ?? lastGoodRef.current;

  return {
    checkoutTotals: displayTotals,
    loadingCheckoutTotals: loading,
    checkoutTotalsStale: staleAfterError,
  };
}
