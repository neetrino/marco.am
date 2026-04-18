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
  /** Customer first name (stored on order address JSON) */
  firstName?: string;
  /** Customer last name (stored on order address JSON) */
  lastName?: string;
  /** Customer-visible order notes */
  notes?: string;
  email: string;
  phone: string;
  shippingMethod?: string;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    /** Alias used by storefront checkout form */
    address?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    countryCode?: string;
    phone?: string;
  };
  /** Ignored at checkout — server computes from shippingMethod + shippingAddress.city */
  shippingAmount?: number;
  couponCode?: string;
  paymentMethod?: string;
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




