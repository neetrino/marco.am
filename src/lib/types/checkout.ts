/**
 * Checkout types for orders service
 */

export interface CheckoutData {
  cartId?: string;
  items?: Array<{
    variantId: string;
    productId: string;
    quantity: number;
  }>;
  email: string;
  phone: string;
  shippingMethod?: string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    countryCode?: string;
    phone?: string;
  };
  /** Ignored at checkout — server computes from shippingMethod + shippingAddress.city + product class */
  shippingAmount?: number;
  paymentMethod?: string;
  /** Promo code applied at checkout (validated server-side) */
  couponCode?: string;
  /** Customer notes for the order */
  notes?: string;
  billingAddress?: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    countryCode?: string;
    phone?: string;
  };
}




