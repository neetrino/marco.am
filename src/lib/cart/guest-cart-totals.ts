import { fetchGuestCart } from '../../app/cart/cart-fetcher';
import { cartLineSubtotal } from '../../app/cart/line-subtotal';
import {
  readStoredGuestCart,
  type StoredGuestCartItem,
} from '../../app/cart/guest-cart-local';
import { getStoredLanguage } from '../language';
import { t as translate } from '../i18n';

export type GuestCartTotals = {
  itemsCount: number;
  total: number;
};

/** Synchronous guest cart summary from localStorage (header paint on reload). */
export function readGuestCartSummarySync(): GuestCartTotals {
  return computeGuestCartTotalsFromStorage(readStoredGuestCart());
}

export function computeGuestCartTotalsFromStorage(items: StoredGuestCartItem[]): GuestCartTotals {
  const itemsCount = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const total = items.reduce(
    (sum, item) => sum + cartLineSubtotal(Number(item.price) || 0, item.quantity),
    0,
  );
  return { itemsCount, total };
}

export function guestCartNeedsCatalogPriceResolution(items: StoredGuestCartItem[]): boolean {
  if (items.length === 0) {
    return false;
  }
  const { itemsCount, total } = computeGuestCartTotalsFromStorage(items);
  if (itemsCount === 0) {
    return false;
  }
  if (total > 0) {
    return false;
  }
  return items.some((item) => !Number.isFinite(Number(item.price)) || Number(item.price) <= 0);
}

/** Reads guest cart totals from localStorage, resolving catalog + variant prices when stored prices are missing. */
export async function loadGuestCartTotals(): Promise<GuestCartTotals> {
  const items = readStoredGuestCart();
  if (items.length === 0) {
    return { itemsCount: 0, total: 0 };
  }

  const storedTotals = computeGuestCartTotalsFromStorage(items);
  if (!guestCartNeedsCatalogPriceResolution(items)) {
    return storedTotals;
  }

  try {
    const lang = getStoredLanguage();
    const cart = await fetchGuestCart((key) => translate(lang, key));
    if (!cart) {
      return storedTotals;
    }
    return {
      itemsCount: cart.itemsCount,
      total: Number(cart.totals.total) || 0,
    };
  } catch {
    return storedTotals;
  }
}
