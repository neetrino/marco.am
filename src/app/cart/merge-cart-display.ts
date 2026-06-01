import { cartLineSubtotal } from './line-subtotal';
import type { Cart, CartItem } from './types';

function cartItemKey(item: CartItem): string {
  return `${item.variant.product.id}:${item.variant.id}`;
}

export function isGenericCartTitle(title: string): boolean {
  const normalized = title.trim().toLowerCase();
  return normalized === 'product' || normalized === 'ապրանք' || normalized === 'товар';
}

function resolveDisplayTitle(previousTitle: string, nextTitle: string): string {
  if (nextTitle && !isGenericCartTitle(nextTitle)) {
    return nextTitle;
  }
  if (previousTitle && !isGenericCartTitle(previousTitle)) {
    return previousTitle;
  }
  return nextTitle || previousTitle;
}

function resolveDisplayImage(
  previousImage: string | null | undefined,
  nextImage: string | null | undefined,
): string | null {
  return nextImage || previousImage || null;
}

function mergeCartItemDisplay(previous: CartItem, next: CartItem): CartItem {
  return {
    ...next,
    quantity: next.quantity,
    price: next.price > 0 ? next.price : previous.price,
    variant: {
      ...next.variant,
      sku: next.variant.sku || previous.variant.sku,
      product: {
        ...next.variant.product,
        slug: next.variant.product.slug || previous.variant.product.slug,
        title: resolveDisplayTitle(
          previous.variant.product.title,
          next.variant.product.title,
        ),
        image: resolveDisplayImage(
          previous.variant.product.image,
          next.variant.product.image,
        ),
      },
    },
  };
}

function buildCartTotals(items: CartItem[], currency: string): Cart['totals'] {
  const subtotal = items.reduce(
    (sum, item) => sum + cartLineSubtotal(item.price, item.quantity),
    0,
  );
  return {
    subtotal,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: subtotal,
    currency,
  };
}

/** Merges refreshed cart rows without losing items, titles, or images already on screen. */
export function mergeCartDisplayState(
  previous: Cart | null,
  next: Cart | null,
): Cart | null {
  if (!next && !previous) {
    return null;
  }
  if (!next) {
    return previous;
  }
  if (!previous) {
    return next;
  }

  const nextByKey = new Map(next.items.map((item) => [cartItemKey(item), item]));
  const previousByKey = new Map(previous.items.map((item) => [cartItemKey(item), item]));
  const mergedItems: CartItem[] = [];
  const seenKeys = new Set<string>();

  for (const nextItem of next.items) {
    const key = cartItemKey(nextItem);
    seenKeys.add(key);
    const previousItem = previousByKey.get(key);
    mergedItems.push(
      previousItem ? mergeCartItemDisplay(previousItem, nextItem) : nextItem,
    );
  }

  for (const previousItem of previous.items) {
    const key = cartItemKey(previousItem);
    if (!seenKeys.has(key)) {
      mergedItems.push(previousItem);
    }
  }

  const itemsCount = mergedItems.reduce((sum, item) => sum + Number(item.quantity), 0);
  const currency = next.totals.currency || previous.totals.currency || 'AMD';

  return {
    ...next,
    items: mergedItems,
    itemsCount,
    totals: buildCartTotals(mergedItems, currency),
  };
}
