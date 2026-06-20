import type { Cart } from '../../app/cart/types';

type CartSummaryEventDetail = {
  itemsCount: number;
  total: number;
  currency: string;
};

/** Notifies header cart pill with authoritative count + total (avoids bare invalidation races). */
export function dispatchCartSummaryUpdate(cart: Cart | null): void {
  const detail: CartSummaryEventDetail = cart
    ? {
        itemsCount: Number(cart.itemsCount) || 0,
        total: Number(cart.totals.total) || 0,
        currency: cart.totals.currency ?? 'AMD',
      }
    : { itemsCount: 0, total: 0, currency: 'AMD' };

  window.dispatchEvent(new CustomEvent('cart-updated', { detail }));
}
