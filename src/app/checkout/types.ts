import type { CheckoutPaymentMethodId } from '../../lib/constants/checkout-payment-method';
import type { ShippingMethodId } from '../../lib/constants/shipping-method';

export type CheckoutFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Optional order notes (delivery instructions, etc.) */
  notes: string;
  shippingMethod: ShippingMethodId;
  paymentMethod: CheckoutPaymentMethodId;
  shippingAddress?: string;
  shippingCity?: string;
};

export interface CartItem {
  id: string;
  variant: {
    id: string;
    sku: string;
    product: {
      id: string;
      title: string;
      slug: string;
      image?: string | null;
    };
  };
  quantity: number;
  price: number;
  total: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
  };
  itemsCount: number;
}

