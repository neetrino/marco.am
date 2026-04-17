import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { clearGuestCart } from '../checkoutUtils';
import type { CheckoutTotalsResponse } from '../../../lib/types/checkout-totals';
import type { CheckoutFormData, Cart, CartItem } from '../types';
import type { CheckoutFormFieldName } from '../utils/checkout-api-errors';
import { parseCheckoutSubmissionError } from '../utils/checkout-api-errors';

interface UseOrderSubmissionProps {
  cart: Cart | null;
  isLoggedIn: boolean;
  checkoutTotals: CheckoutTotalsResponse | null;
  setError: (error: string | null) => void;
  clearFieldErrors: () => void;
  setFieldError: (field: CheckoutFormFieldName, message: string) => void;
}

export function useOrderSubmission({
  cart,
  isLoggedIn,
  checkoutTotals,
  setError,
  clearFieldErrors,
  setFieldError,
}: UseOrderSubmissionProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const submitOrder = async (data: CheckoutFormData) => {
    setError(null);
    clearFieldErrors();

    try {
      if (!cart) {
        throw new Error(t('checkout.errors.cartEmpty'));
      }

      let cartId = cart.id;
      let items = undefined;

      if (!isLoggedIn && cart.id === 'guest-cart') {
        items = cart.items.map((item: CartItem) => ({
          productId: item.variant.product.id,
          variantId: item.variant.id,
          quantity: item.quantity,
        }));
        cartId = 'guest-cart';
      }

      const shippingAddress = data.shippingMethod === 'courier' && 
        data.shippingAddress && 
        data.shippingCity
        ? {
            address: data.shippingAddress,
            city: data.shippingCity,
          }
        : undefined;

      const shippingAmount =
        data.shippingMethod === 'courier' && checkoutTotals
          ? checkoutTotals.shippingAmount
          : 0;

      const trimmedNotes = data.notes.trim();
      const response = await apiClient.post<{
        order: {
          id: string;
          number: string;
          status: string;
          paymentStatus: string;
          total: number;
          currency: string;
        };
        payment: {
          provider: string;
          paymentUrl: string | null;
          expiresAt: string | null;
        };
        nextAction: string;
      }>('/api/v1/orders/checkout', {
        cartId: cartId,
        ...(items ? { items } : {}),
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        shippingMethod: data.shippingMethod,
        ...(shippingAddress ? { shippingAddress } : {}),
        shippingAmount: shippingAmount,
        paymentMethod: data.paymentMethod,
      });

      if (!isLoggedIn) {
        clearGuestCart();
      }

      if (response.payment?.paymentUrl) {
        window.location.href = response.payment.paymentUrl;
        return;
      }

      router.push(`/orders/${response.order.number}`);
    } catch (err: unknown) {
      const parsedError = parseCheckoutSubmissionError(err, t);
      parsedError.fieldErrors.forEach((fieldError) => {
        setFieldError(fieldError.field, fieldError.message);
      });
      setError(parsedError.globalError);
    }
  };

  return { submitOrder };
}




