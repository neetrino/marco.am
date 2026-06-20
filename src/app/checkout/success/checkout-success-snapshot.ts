import type { OrderDetails } from '@/app/profile/types';
import { getPickupBranchLabel, isPickupBranchId } from '@/lib/constants/pickup-branches';
import { getStoredLanguage } from '@/lib/language';
import type { Cart, CheckoutFormData } from '../types';

const CHECKOUT_SUCCESS_SNAPSHOT_KEY = 'checkout_success_snapshot';

type CartItemWithOptions = Cart['items'][number] & {
  variant: Cart['items'][number]['variant'] & {
    options?: Array<{
      attributeKey?: string;
      attributeName?: string;
      value?: string;
    }>;
  };
};

type CheckoutOrderSnapshotInput = {
  orderId: string;
  orderNumber: string;
  currency: string;
  cart: Cart;
  form: CheckoutFormData;
  subtotal: number;
  shippingAmount: number;
  discount: number;
  total: number;
};

function buildOrderDetailsSnapshot(input: CheckoutOrderSnapshotInput): OrderDetails {
  const now = new Date().toISOString();
  const shippingAddress =
    input.form.shippingMethod === 'courier' &&
    input.form.shippingAddress &&
    input.form.shippingCity
      ? {
          firstName: input.form.firstName,
          lastName: input.form.lastName,
          addressLine1: input.form.shippingAddress,
          city: input.form.shippingCity,
          countryCode: 'AM',
          phone: input.form.phone,
        }
      : input.form.shippingMethod === 'pickup' &&
          input.form.pickupBranchId &&
          isPickupBranchId(input.form.pickupBranchId)
        ? {
            firstName: input.form.firstName,
            lastName: input.form.lastName,
            addressLine1: getPickupBranchLabel(
              input.form.pickupBranchId,
              getStoredLanguage()
            ),
            city: '',
            countryCode: 'AM',
            phone: input.form.phone,
          }
        : null;

  return {
    id: input.orderId,
    number: input.orderNumber,
    status: 'pending',
    paymentStatus: 'pending',
    fulfillmentStatus: 'unfulfilled',
    items: input.cart.items.map((item) => {
      const cartItem = item as CartItemWithOptions;
      const variantOptions =
        cartItem.variant.options?.map((option) => ({
          attributeKey: option.attributeKey,
          value: option.value,
          label: option.attributeName || option.value,
        })) ?? [];

      return {
        variantId: cartItem.variant.id,
        productTitle: cartItem.variant.product.title,
        variantTitle: variantOptions
          .map((option) => `${option.attributeKey ?? ''}: ${option.value ?? ''}`)
          .join(', '),
        sku: cartItem.variant.sku,
        quantity: cartItem.quantity,
        price: cartItem.price,
        total: cartItem.total,
        imageUrl: cartItem.variant.product.image ?? undefined,
        variantOptions,
      };
    }),
    totals: {
      subtotal: input.subtotal,
      discount: input.discount,
      shipping: input.shippingAmount,
      tax: 0,
      total: input.total,
      currency: input.currency,
    },
    customer: {
      email: input.form.email,
      phone: input.form.phone,
    },
    shippingAddress,
    shippingMethod: input.form.shippingMethod,
    createdAt: now,
    updatedAt: now,
  };
}

function saveCheckoutSuccessSnapshot(order: OrderDetails): void {
  try {
    sessionStorage.setItem(CHECKOUT_SUCCESS_SNAPSHOT_KEY, JSON.stringify(order));
  } catch {
    // Ignore quota / private mode errors — success page falls back to API fetch.
  }
}

export function loadCheckoutSuccessSnapshot(orderNumber: string): OrderDetails | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SUCCESS_SNAPSHOT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as OrderDetails;
    if (parsed.number !== orderNumber || !Array.isArray(parsed.items)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCheckoutSuccessSnapshotFromCheckout(
  cart: Cart,
  form: CheckoutFormData,
  order: {
    id: string;
    number: string;
    currency: string;
    total: number;
  },
  totals: {
    subtotal: number;
    shippingAmount: number;
    discount: number;
  }
): void {
  saveCheckoutSuccessSnapshot(
    buildOrderDetailsSnapshot({
      orderId: order.id,
      orderNumber: order.number,
      currency: order.currency,
      cart,
      form,
      subtotal: totals.subtotal,
      shippingAmount: totals.shippingAmount,
      discount: totals.discount,
      total: order.total,
    })
  );
}
