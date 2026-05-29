import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { getClientErrorDetail } from '@/lib/api-client/types';
import { isCourierShipping, type ShippingMethodId } from '@/lib/constants/shipping-method';
import type { CheckoutTotalsResponse } from '@/lib/types/checkout-totals';
import type { Cart, CartItem } from '../types';

const GUEST_COUPON_KEY = 'shop_checkout_coupon';

function readGuestCoupon(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const stored = sessionStorage.getItem(GUEST_COUPON_KEY);
  return stored?.trim() ? stored.trim().toUpperCase() : null;
}

function buildGuestPayloadItems(cart: Cart) {
  return cart.items.map((item: CartItem) => ({
    productId: item.variant.product.id,
    variantId: item.variant.id,
    quantity: item.quantity,
  }));
}

type ValidateGuestPromoInput = {
  cart: Cart;
  couponCode: string;
  shippingMethod: ShippingMethodId;
  shippingCity?: string;
  customerEmail?: string;
};

async function validateGuestPromo(input: ValidateGuestPromoInput): Promise<void> {
  const body: Record<string, unknown> = {
    shippingMethod: input.shippingMethod,
    country: 'Armenia',
    couponCode: input.couponCode,
    items: buildGuestPayloadItems(input.cart),
  };
  if (isCourierShipping(input.shippingMethod) && input.shippingCity?.trim()) {
    body.city = input.shippingCity.trim();
  }
  if (input.customerEmail?.trim()) {
    body.customerEmail = input.customerEmail.trim();
  }
  await apiClient.post<CheckoutTotalsResponse>('/api/v1/checkout/totals', body);
}

type UseCheckoutPromoOptions = {
  isLoggedIn: boolean;
  cart: Cart | null;
  shippingMethod: ShippingMethodId;
  shippingCity?: string;
  customerEmail?: string;
  onCartRefresh: () => void;
};

export function useCheckoutPromo({
  isLoggedIn,
  cart,
  shippingMethod,
  shippingCity,
  customerEmail,
  onCartRefresh,
}: UseCheckoutPromoOptions) {
  const [guestCouponCode, setGuestCouponCode] = useState<string | null>(null);
  const [userCouponCodeOverride, setUserCouponCodeOverride] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setGuestCouponCode(readGuestCoupon());
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setUserCouponCodeOverride(null);
      return;
    }
    setUserCouponCodeOverride(null);
  }, [isLoggedIn, cart?.couponCode]);

  const appliedCouponCode = isLoggedIn
    ? (userCouponCodeOverride ?? cart?.couponCode ?? null)
    : guestCouponCode;

  const persistGuestCoupon = useCallback((code: string | null) => {
    const normalized = code?.trim().toUpperCase() || null;
    setGuestCouponCode(normalized);
    if (typeof window === 'undefined') {
      return;
    }
    if (normalized) {
      sessionStorage.setItem(GUEST_COUPON_KEY, normalized);
    } else {
      sessionStorage.removeItem(GUEST_COUPON_KEY);
    }
  }, []);

  const applyPromo = useCallback(
    async (rawCode: string): Promise<string | null> => {
      const couponCode = rawCode.trim().toUpperCase();
      if (!couponCode) {
        return 'empty';
      }
      if (!cart || cart.items.length === 0) {
        return 'empty';
      }

      if (isLoggedIn) {
        try {
          await apiClient.put('/api/v1/cart/coupon', { couponCode });
          setUserCouponCodeOverride(couponCode);
          onCartRefresh();
          window.dispatchEvent(new Event('cart-updated'));
          return null;
        } catch {
          const body: Record<string, unknown> = {
            shippingMethod,
            country: 'Armenia',
            couponCode,
          };
          if (isCourierShipping(shippingMethod) && shippingCity?.trim()) {
            body.city = shippingCity.trim();
          }
          if (cart.id !== 'guest-cart') {
            body.cartId = cart.id;
          } else {
            body.items = buildGuestPayloadItems(cart);
          }
          if (customerEmail?.trim()) {
            body.customerEmail = customerEmail.trim();
          }
          await apiClient.post<CheckoutTotalsResponse>('/api/v1/checkout/totals', body);
          setUserCouponCodeOverride(couponCode);
          return null;
        }
      }

      await validateGuestPromo({
        cart,
        couponCode,
        shippingMethod,
        shippingCity,
        customerEmail,
      });
      persistGuestCoupon(couponCode);
      return null;
    },
    [cart, customerEmail, isLoggedIn, onCartRefresh, persistGuestCoupon, shippingCity, shippingMethod]
  );

  const clearPromo = useCallback(async (): Promise<void> => {
    if (isLoggedIn) {
      await apiClient.delete('/api/v1/cart/coupon');
      setUserCouponCodeOverride(null);
      onCartRefresh();
      window.dispatchEvent(new Event('cart-updated'));
      return;
    }
    persistGuestCoupon(null);
  }, [isLoggedIn, onCartRefresh, persistGuestCoupon]);

  return {
    appliedCouponCode,
    applyPromo,
    clearPromo,
  };
}

export function getPromoErrorMessage(
  err: unknown,
  t: (key: string) => string
): string {
  return getClientErrorDetail(err) ?? t('common.cart.promoApplyFailed');
}
