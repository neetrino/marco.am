import type { CartVariantOption } from '../../lib/cart/format-cart-variant-options';
import { CART_KEY } from './constants';
import type { Cart, CartItem } from './types';
import { cartLineSubtotal } from './line-subtotal';
import { normalizeProductSlug } from './guest-cart-product-utils';

/** Guest cart row persisted in localStorage (includes optional display snapshots). */
export interface StoredGuestCartItem {
  productId: string;
  productSlug?: string;
  variantId: string;
  quantity: number;
  price?: number;
  title?: string;
  image?: string | null;
  sku?: string;
  stock?: number;
  originalPrice?: number | null;
  options?: CartVariantOption[];
}

export function readStoredGuestCart(): StoredGuestCartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? (JSON.parse(stored) as StoredGuestCartItem[]) : [];
  } catch {
    return [];
  }
}

function writeStoredGuestCart(items: StoredGuestCartItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

let guestCartMutationChain: Promise<unknown> = Promise.resolve();

/** Serializes guest cart read-modify-write to prevent concurrent adds from overwriting each other. */
export function runGuestCartMutation<T>(fn: () => T): Promise<T> {
  const result = guestCartMutationChain.then(() => fn());
  guestCartMutationChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

type GuestCartUpsertInput = {
  productId: string;
  productSlug: string;
  variantId: string;
  quantityDelta: number;
  price?: number;
  title?: string;
  image?: string | null;
  sku?: string;
  stock?: number;
  originalPrice?: number | null;
  options?: CartVariantOption[];
};

function normalizeStoredImage(image: string | null | undefined): string | null {
  const trimmed = image?.trim();
  return trimmed || null;
}

/** Adds or increments a guest cart line atomically. */
export function upsertGuestCartItem(input: GuestCartUpsertInput): StoredGuestCartItem[] {
  const cart = readStoredGuestCart();
  const normalizedImage = normalizeStoredImage(input.image);
  const normalizedTitle = input.title?.trim() || undefined;
  const existing = cart.find(
    (item) => item.productId === input.productId && item.variantId === input.variantId,
  );

  if (existing) {
    existing.quantity += input.quantityDelta;
    if (input.price !== undefined && input.price > 0) {
      existing.price = input.price;
    }
    if (input.productSlug) {
      existing.productSlug = input.productSlug;
    }
    if (normalizedTitle) {
      existing.title = normalizedTitle;
    }
    if (normalizedImage) {
      existing.image = normalizedImage;
    } else if (input.image !== undefined && !existing.image) {
      existing.image = normalizedImage;
    }
    if (input.sku) {
      existing.sku = input.sku;
    }
    if (input.stock !== undefined) {
      existing.stock = input.stock;
    }
    if (input.originalPrice !== undefined) {
      existing.originalPrice = input.originalPrice;
    }
    if (input.options?.length) {
      existing.options = input.options;
    }
  } else {
    cart.push({
      productId: input.productId,
      productSlug: input.productSlug,
      variantId: input.variantId,
      quantity: input.quantityDelta,
      price: input.price,
      title: normalizedTitle,
      image: normalizedImage,
      sku: input.sku,
      stock: input.stock,
      originalPrice: input.originalPrice,
      options: input.options,
    });
  }

  writeStoredGuestCart(cart);
  return cart;
}

/** Removes a guest cart line atomically. */
export function removeGuestCartItem(productId: string, variantId: string): StoredGuestCartItem[] {
  const cart = readStoredGuestCart().filter(
    (item) => !(item.productId === productId && item.variantId === variantId),
  );
  writeStoredGuestCart(cart);
  return cart;
}

/** Updates quantity for a guest cart line atomically. */
export function updateGuestCartItemQuantity(
  productId: string,
  variantId: string,
  quantity: number,
): StoredGuestCartItem[] {
  const cart = readStoredGuestCart();
  const item = cart.find(
    (row) => row.productId === productId && row.variantId === variantId,
  );
  if (item) {
    item.quantity = quantity;
    writeStoredGuestCart(cart);
  }
  return cart;
}

function buildCartFromItems(validItems: CartItem[]): Cart {
  const subtotal = validItems.reduce(
    (sum, item) => sum + cartLineSubtotal(item.price, item.quantity),
    0,
  );
  const itemsCount = validItems.reduce((sum, item) => sum + Number(item.quantity), 0);

  return {
    id: 'guest-cart',
    items: validItems,
    totals: {
      subtotal,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: subtotal,
      currency: 'AMD',
    },
    itemsCount,
  };
}

/**
 * Builds a guest cart synchronously from localStorage (no network).
 * Used for instant drawer paint before API refresh.
 */
export function buildGuestCartFromStorage(
  t: (key: string) => string,
): Cart | null {
  const guestCart = readStoredGuestCart();
  if (guestCart.length === 0) {
    return null;
  }

  const items: CartItem[] = guestCart.map((item, index) => {
    const unitPrice = Number(item.price) || 0;
    const slug = normalizeProductSlug(item.productSlug) ?? '';
    const title = item.title?.trim() || t('common.messages.product');

    return {
      id: `${item.productId}-${item.variantId}-${index}`,
      variant: {
        id: item.variantId,
        sku: item.sku ?? '',
        stock: item.stock,
        options: item.options,
        product: {
          id: item.productId,
          title,
          slug,
          image: normalizeStoredImage(item.image),
        },
      },
      quantity: Number(item.quantity),
      price: unitPrice,
      originalPrice: item.originalPrice ?? null,
      total: cartLineSubtotal(unitPrice, item.quantity),
    };
  });

  return buildCartFromItems(items);
}

/** Merges fetched display fields back into localStorage for faster subsequent opens. */
export function persistGuestCartSnapshots(
  guestCart: StoredGuestCartItem[],
  snapshots: Map<string, Partial<StoredGuestCartItem>>,
): void {
  if (snapshots.size === 0) {
    return;
  }

  let changed = false;
  const updated = guestCart.map((item) => {
    const key = `${item.productId}:${item.variantId}`;
    const patch = snapshots.get(key);
    if (!patch) {
      return item;
    }
    changed = true;
    const merged = { ...item, ...patch };
    if (!patch.image && item.image) {
      merged.image = item.image;
    }
    if (!patch.title?.trim() && item.title?.trim()) {
      merged.title = item.title;
    }
    return merged;
  });

  if (changed) {
    writeStoredGuestCart(updated);
  }
}
