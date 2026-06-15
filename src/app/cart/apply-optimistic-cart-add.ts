import { cartLineSubtotal } from './line-subtotal';
import type { Cart, CartItem } from './types';

export type OptimisticCartAddDetail = {
  quantity?: number;
  price?: number;
  productId?: string;
  variantId?: string;
  productSlug?: string;
  title?: string;
  image?: string | null;
};

function cartItemMatchKey(productId: string, variantId: string): string {
  return `${productId}:${variantId}`;
}

/** Applies an optimistic line add for instant cart drawer paint (logged-in users). */
export function applyOptimisticCartAdd(
  previous: Cart | null,
  add: OptimisticCartAddDetail,
  t: (key: string) => string,
): Cart | null {
  const productId = add.productId?.trim();
  const variantId = add.variantId?.trim();
  if (!productId || !variantId) {
    return previous;
  }

  const quantity = add.quantity ?? 1;
  const price = add.price ?? 0;
  const title = add.title?.trim() || t('common.messages.product');
  const slug = add.productSlug?.trim() || '';
  const image = add.image?.trim() || null;
  const matchKey = cartItemMatchKey(productId, variantId);

  const existingItems = previous?.items ?? [];
  const existingIndex = existingItems.findIndex(
    (item) => cartItemMatchKey(item.variant.product.id, item.variant.id) === matchKey,
  );

  let nextItems: CartItem[];
  if (existingIndex >= 0) {
    nextItems = existingItems.map((item, index) => {
      if (index !== existingIndex) {
        return item;
      }
      const nextQuantity = item.quantity + quantity;
      return {
        ...item,
        quantity: nextQuantity,
        total: cartLineSubtotal(item.price, nextQuantity),
      };
    });
  } else {
    const optimisticItem: CartItem = {
      id: `optimistic-${productId}-${variantId}`,
      variant: {
        id: variantId,
        sku: '',
        product: {
          id: productId,
          title,
          slug,
          image,
        },
      },
      quantity,
      price,
      total: cartLineSubtotal(price, quantity),
    };
    nextItems = [...existingItems, optimisticItem];
  }

  const subtotal = nextItems.reduce(
    (sum, item) => sum + cartLineSubtotal(item.price, item.quantity),
    0,
  );
  const itemsCount = nextItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: previous?.id ?? 'optimistic-cart',
    items: nextItems,
    totals: {
      subtotal,
      discount: 0,
      shipping: 0,
      tax: 0,
      total: subtotal,
      currency: previous?.totals.currency ?? 'AMD',
    },
    itemsCount,
  };
}
