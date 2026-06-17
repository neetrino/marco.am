import { fetchGuestCartCatalogProducts } from '../../app/cart/guest-cart-catalog-fetch';
import { cartLineSubtotal, resolveGuestUnitPrice } from '../../app/cart/line-subtotal';
import {
  readStoredGuestCart,
  type StoredGuestCartItem,
} from '../../app/cart/guest-cart-local';

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

async function resolveGuestCartTotalsFromCatalog(
  items: StoredGuestCartItem[],
): Promise<GuestCartTotals> {
  if (items.length === 0) {
    return { itemsCount: 0, total: 0 };
  }

  const catalogById = await fetchGuestCartCatalogProducts(items.map((item) => item.productId));
  const itemsCount = items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const total = items.reduce((sum, item) => {
    const catalog = catalogById.get(item.productId);
    const unitPrice = resolveGuestUnitPrice(catalog?.price ?? 0, item.price);
    return sum + cartLineSubtotal(unitPrice, item.quantity);
  }, 0);

  return { itemsCount, total };
}

/** Reads guest cart totals from localStorage, resolving catalog prices when stored prices are missing. */
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
    return await resolveGuestCartTotalsFromCatalog(items);
  } catch {
    return storedTotals;
  }
}
