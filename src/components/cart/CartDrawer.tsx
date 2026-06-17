'use client';

import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { useCartData } from '../../app/cart/use-cart-data';
import { coerceCurrencyCode } from '../../lib/currency';
import { useCartDrawer } from '../../lib/cart/cart-drawer-context';
import { useCartSummary } from '../../lib/cart/cart-summary-context';
import { CartIcon } from '../icons/CartIcon';
import { CART_DRAWER_OVERLAY_CLASS, CART_DRAWER_PANEL_CLASS } from './cart-drawer.constants';
import { CartDrawerItemRow } from './CartDrawerItemRow';
import { CartDrawerSummary } from './CartDrawerSummary';

export function CartDrawer() {
  const router = useRouter();
  const { isOpen, closeCartDrawer } = useCartDrawer();
  const { cartCount } = useCartSummary();
  const prefetchCart = isOpen || cartCount > 0;
  const { cart, loading, currency, updatingItems, onRemoveItem, onUpdateQuantity, t } =
    useCartData({ enabled: prefetchCart });

  const handleClose = useCallback(() => {
    closeCartDrawer();
  }, [closeCartDrawer]);

  const handleCheckoutNavigate = useCallback(() => {
    closeCartDrawer();
  }, [closeCartDrawer]);

  const handleProceedToCheckout = useCallback(() => {
    closeCartDrawer();
    router.push('/checkout');
  }, [closeCartDrawer, router]);

  useEffect(() => {
    document.body.dataset.cartDrawerOpen = isOpen ? 'true' : 'false';

    if (!isOpen) {
      return () => {
        delete document.body.dataset.cartDrawerOpen;
      };
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      delete document.body.dataset.cartDrawerOpen;
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleClose, isOpen]);

  if (!isOpen || typeof document === 'undefined') {
    return null;
  }

  const itemCount = cart?.itemsCount ?? cart?.items.length ?? 0;
  const itemLabel =
    itemCount === 1 ? t('common.cart.item') : t('common.cart.items');
  const currencyCode = coerceCurrencyCode(currency, 'AMD');
  const amountCurrency = coerceCurrencyCode(cart?.totals.currency, 'AMD');

  return createPortal(
    <>
      <button
        type="button"
        className={CART_DRAWER_OVERLAY_CLASS}
        onClick={handleClose}
        aria-label={t('common.buttons.close')}
      />
      <aside
        className={`${CART_DRAWER_PANEL_CLASS} animate-in slide-in-from-right duration-200 motion-reduce:animate-none`}
        role="dialog"
        aria-modal="true"
        aria-label={t('common.cart.myCart')}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-marco-border/80 px-4 py-4 dark:border-white/10">
          <h2 className="text-lg font-bold text-marco-black dark:text-white">
            {t('common.cart.myCart')}
            {!loading && itemCount > 0 ? (
              <span className="ml-1 text-base font-semibold text-[var(--app-text-muted)]">
                ({itemCount} {itemLabel})
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-marco-border bg-white text-marco-black transition-colors hover:bg-marco-gray dark:border-white/15 dark:bg-zinc-900 dark:text-white"
            aria-label={t('common.buttons.close')}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          {loading && (!cart || cart.items.length === 0) ? (
            <div className="flex flex-1 items-center justify-center px-4 py-10">
              <p className="text-sm text-[var(--app-text-muted)]">{t('common.messages.loading')}</p>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-4 text-[var(--app-text-soft)]" aria-hidden>
                <CartIcon size={72} />
              </div>
              <p className="text-base font-semibold text-marco-black dark:text-white">
                {t('common.cart.empty')}
              </p>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  router.push('/products');
                }}
                className="mt-5 inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-marco-yellow px-6 text-sm font-semibold text-marco-black transition-[filter] hover:brightness-95"
              >
                {t('common.buttons.browseProducts')}
              </button>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <CartDrawerItemRow
                      key={item.id}
                      item={item}
                      currency={currencyCode}
                      amountCurrency={amountCurrency}
                      updating={updatingItems.has(item.id)}
                      onRemove={onRemoveItem}
                      onUpdateQuantity={onUpdateQuantity}
                      onNavigate={handleCheckoutNavigate}
                      t={t}
                    />
                  ))}
                </div>
              </div>
              <CartDrawerSummary
                cart={cart}
                currency={currencyCode}
                onCheckout={handleProceedToCheckout}
                t={t}
              />
            </>
          )}
        </div>
      </aside>
    </>,
    document.body,
  );
}
