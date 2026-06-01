import { apiClient } from '../../lib/api-client';
import { logger } from '../../lib/utils/logger';
import type { Cart, CartItem } from './types';
import {
  runGuestCartMutation,
  removeGuestCartItem,
  updateGuestCartItemQuantity,
} from './guest-cart-local';
import { cartLineSubtotal } from './line-subtotal';

/**
 * Calculate cart totals
 */
function calculateCartTotals(items: CartItem[], existingTotals: Cart['totals']): Cart['totals'] {
  const newSubtotal = items.reduce((sum, item) => sum + cartLineSubtotal(item.price, item.quantity), 0);
  return {
    ...existingTotals,
    subtotal: newSubtotal,
    total: newSubtotal + existingTotals.tax + existingTotals.shipping - existingTotals.discount,
  };
}

function buildOptimisticCart(cart: Cart, updatedItems: CartItem[]): Cart | null {
  if (updatedItems.length === 0) {
    return null;
  }

  const newItemsCount = updatedItems.reduce((sum, item) => sum + Number(item.quantity), 0);
  return {
    ...cart,
    items: updatedItems,
    totals: calculateCartTotals(updatedItems, cart.totals),
    itemsCount: newItemsCount,
  };
}

async function persistGuestCartRemoval(productId: string, variantId: string): Promise<void> {
  await runGuestCartMutation(() => {
    removeGuestCartItem(productId, variantId);
  });
}

async function persistGuestCartQuantity(
  productId: string,
  variantId: string,
  quantity: number,
): Promise<void> {
  await runGuestCartMutation(() => {
    updateGuestCartItemQuantity(productId, variantId, quantity);
  });
}

/**
 * Handle remove item from cart
 */
export async function handleRemoveItem(
  itemId: string,
  cart: Cart,
  isLoggedIn: boolean,
  setCart: (cart: Cart | null) => void,
  fetchCart: () => Promise<void>,
): Promise<void> {
  const itemToRemove = cart.items.find((item) => item.id === itemId);
  if (!itemToRemove) {
    return;
  }

  const updatedItems = cart.items.filter((item) => item.id !== itemId);
  setCart(buildOptimisticCart(cart, updatedItems));

  try {
    if (!isLoggedIn) {
      await persistGuestCartRemoval(
        itemToRemove.variant.product.id,
        itemToRemove.variant.id,
      );
      window.dispatchEvent(new Event('cart-updated'));
      return;
    }

    await apiClient.delete(`/api/v1/cart/items/${itemId}`);
    window.dispatchEvent(new Event('cart-updated'));
  } catch (error: unknown) {
    logger.error('Error removing item', { error, itemId });
    await fetchCart();
  }
}

/**
 * Handle update item quantity in cart
 */
export async function handleUpdateQuantity(
  itemId: string,
  quantity: number,
  cart: Cart | null,
  isLoggedIn: boolean,
  setCart: (cart: Cart | null) => void,
  setUpdatingItems: (fn: (prev: Set<string>) => Set<string>) => void,
  fetchCart: () => Promise<void>,
  t: (key: string) => string,
): Promise<void> {
  if (quantity < 1) {
    if (cart) {
      await handleRemoveItem(itemId, cart, isLoggedIn, setCart, fetchCart);
    }
    return;
  }

  const cartItem = cart?.items.find((item) => item.id === itemId);
  if (!cartItem) {
    return;
  }

  if (cartItem.variant.stock !== undefined && quantity > cartItem.variant.stock) {
    alert(`Մատչելի քանակը ${cartItem.variant.stock} հատ է: Դուք չեք կարող ավելացնել ավելի շատ քանակ:`);
    return;
  }

  if (cart) {
    const updatedItems = cart.items.map((item) =>
      item.id === itemId
        ? { ...item, quantity, total: cartLineSubtotal(item.price, quantity) }
        : item,
    );
    setCart(buildOptimisticCart(cart, updatedItems));
  }

  setUpdatingItems((prev) => new Set(prev).add(itemId));

  try {
    if (!isLoggedIn) {
      if (typeof window === 'undefined') {
        return;
      }

      await persistGuestCartQuantity(
        cartItem.variant.product.id,
        cartItem.variant.id,
        quantity,
      );
      window.dispatchEvent(new Event('cart-updated'));
      return;
    }

    await apiClient.patch(`/api/v1/cart/items/${itemId}`, { quantity });
    window.dispatchEvent(new Event('cart-updated'));
  } catch (error: unknown) {
    const errorObj = error as { detail?: string; message?: string };
    logger.error('Error updating quantity', { error, itemId });
    await fetchCart();

    const errorMessage =
      errorObj?.detail || errorObj?.message || t('common.messages.failedToUpdateQuantity');
    if (errorMessage.includes('stock') || errorMessage.includes('exceeds')) {
      alert(t('common.alerts.stockInsufficient').replace('{message}', errorMessage));
    } else {
      alert(errorMessage);
    }
  } finally {
    setUpdatingItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  }
}
