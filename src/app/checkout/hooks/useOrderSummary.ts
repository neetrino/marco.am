import { useMemo } from "react";
import { cartLineSubtotal } from "../../cart/line-subtotal";
import { convertPrice } from "../../../lib/currency";
import type { CheckoutTotalsResponse } from "../../../lib/types/checkout-totals";
import type { Cart } from "../types";

interface UseOrderSummaryProps {
  cart: Cart | null;
  /** Server-authoritative totals (AMD); when null, legacy cart subtotal + zero shipping until first response */
  checkoutTotals: CheckoutTotalsResponse | null;
  currency: "USD" | "AMD" | "EUR" | "RUB" | "GEL";
}

function amountToAmd(amountRaw: number, cartCurrency: string): number {
  if (!Number.isFinite(amountRaw)) {
    return 0;
  }
  return cartCurrency === "AMD" ? amountRaw : convertPrice(amountRaw, "USD", "AMD");
}

/** Sum of line price × qty, converted to AMD (0 if lines have no usable prices). */
function lineSubtotalAmdOnly(cart: Cart): number {
  const lineSubtotalRaw = cart.items.reduce(
    (sum, item) => sum + cartLineSubtotal(item.price, item.quantity),
    0
  );
  return amountToAmd(lineSubtotalRaw, cart.totals.currency);
}

/** Cart aggregate subtotal in AMD — same source the header uses for logged-in `totals.total` / `subtotal`. */
function cartTotalsSubtotalAmd(cart: Cart): number {
  return amountToAmd(Number(cart.totals.subtotal), cart.totals.currency);
}

function cartTotalsTotalAmd(cart: Cart): number {
  return amountToAmd(Number(cart.totals.total), cart.totals.currency);
}

/**
 * Prefer line math when it is positive; otherwise fall back to `cart.totals.subtotal`
 * (covers guest/header vs line rebuild mismatch and logged-in shape quirks).
 */
function effectiveClientSubtotalAmd(cart: Cart): number {
  const fromLines = lineSubtotalAmdOnly(cart);
  const fromTotals = cartTotalsSubtotalAmd(cart);
  return fromLines > 0 ? fromLines : fromTotals;
}

export function useOrderSummary({
  cart,
  checkoutTotals,
  currency,
}: UseOrderSummaryProps) {
  const orderSummary = useMemo(() => {
    if (!cart || cart.items.length === 0) {
      return {
        subtotalAMD: 0,
        taxAMD: 0,
        shippingAMD: 0,
        totalAMD: 0,
        subtotalDisplay: 0,
        taxDisplay: 0,
        shippingDisplay: 0,
        totalDisplay: 0,
      };
    }

    if (checkoutTotals) {
      const serverSubtotal = Number(checkoutTotals.subtotal);
      const fromClientAmd = effectiveClientSubtotalAmd(cart);
      /** If /checkout/totals returns 0 but the client cart (lines or totals) has a positive subtotal, show that instead. */
      const subtotalAMD =
        serverSubtotal > 0 || fromClientAmd <= 0 ? serverSubtotal : fromClientAmd;
      const taxAMD = Number(checkoutTotals.taxAmount);
      const shippingAMD = Number(checkoutTotals.shippingAmount);
      const discountAmount = Number(checkoutTotals.discountAmount);
      const totalAMD = subtotalAMD - discountAmount + shippingAMD + taxAMD;

      const subtotalDisplay =
        currency === "AMD" ? subtotalAMD : convertPrice(subtotalAMD, "AMD", currency);
      const taxDisplay = currency === "AMD" ? taxAMD : convertPrice(taxAMD, "AMD", currency);
      const shippingDisplay =
        currency === "AMD" ? shippingAMD : convertPrice(shippingAMD, "AMD", currency);
      const totalDisplay =
        currency === "AMD" ? totalAMD : convertPrice(totalAMD, "AMD", currency);

      return {
        subtotalAMD,
        taxAMD,
        shippingAMD,
        totalAMD,
        subtotalDisplay,
        taxDisplay,
        shippingDisplay,
        totalDisplay,
      };
    }

    const lineSubAmd = lineSubtotalAmdOnly(cart);
    const subtotalAMD = effectiveClientSubtotalAmd(cart);
    const taxAMD =
      cart.totals.currency === "AMD"
        ? cart.totals.tax
        : convertPrice(cart.totals.tax, "USD", "AMD");
    const shippingAMD = 0;
    const totalFromCartAmd = cartTotalsTotalAmd(cart);
    const totalAMD =
      lineSubAmd <= 0 && totalFromCartAmd > 0
        ? totalFromCartAmd
        : subtotalAMD + taxAMD + shippingAMD;

    const subtotalDisplay =
      currency === "AMD" ? subtotalAMD : convertPrice(subtotalAMD, "AMD", currency);
    const taxDisplay = currency === "AMD" ? taxAMD : convertPrice(taxAMD, "AMD", currency);
    const shippingDisplay =
      currency === "AMD" ? shippingAMD : convertPrice(shippingAMD, "AMD", currency);
    const totalDisplay =
      currency === "AMD" ? totalAMD : convertPrice(totalAMD, "AMD", currency);

    return {
      subtotalAMD,
      taxAMD,
      shippingAMD,
      totalAMD,
      subtotalDisplay,
      taxDisplay,
      shippingDisplay,
      totalDisplay,
    };
  }, [cart, checkoutTotals, currency]);

  return { orderSummary };
}
