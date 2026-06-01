import type { Cart, CartItem } from './types';

function collectImageUrls(cart: Cart | null): Set<string> {
  const urls = new Set<string>();
  if (!cart) {
    return urls;
  }
  for (const item of cart.items) {
    const image = item.variant.product.image;
    if (image) {
      urls.add(image);
    }
  }
  return urls;
}

function preloadImage(url: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

/**
 * Preloads images that are not yet in the browser cache for this cart session.
 */
export async function preloadNewCartImages(
  previous: Cart | null,
  next: Cart | null,
): Promise<void> {
  if (!next || typeof window === 'undefined') {
    return;
  }

  const knownUrls = collectImageUrls(previous);
  const pendingUrls = new Set<string>();

  for (const item of next.items) {
    const image = item.variant.product.image;
    if (image && !knownUrls.has(image)) {
      pendingUrls.add(image);
    }
  }

  if (pendingUrls.size === 0) {
    return;
  }

  await Promise.all([...pendingUrls].map((url) => preloadImage(url)));
}

export function cartHasMissingImages(cart: Cart | null): boolean {
  if (!cart || cart.items.length === 0) {
    return false;
  }
  return cart.items.some((item) => !item.variant.product.image);
}

export function countCartItemsMissingImages(items: CartItem[]): number {
  return items.filter((item) => !item.variant.product.image).length;
}
