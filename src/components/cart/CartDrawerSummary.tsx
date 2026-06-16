'use client';

import { coerceCurrencyCode, formatMoneyInCurrency, type CurrencyCode } from '../../lib/currency';
import type { Cart } from '../../app/cart/types';

interface CartDrawerSummaryProps {
  cart: Cart;
  currency: CurrencyCode;
  onCheckout: () => void;
  t: (key: string) => string;
}

export function CartDrawerSummary({ cart, currency, onCheckout, t }: CartDrawerSummaryProps) {
  const amountCurrency = coerceCurrencyCode(cart.totals.currency, 'AMD');
  const shippingLabel =
    cart.totals.shipping > 0
      ? formatMoneyInCurrency(cart.totals.shipping, amountCurrency, currency)
      : t('common.cart.shippingNotCalculated');

  return (
    <div className="shrink-0 border-t border-marco-border/80 bg-[#f4f4f4] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-zinc-950 dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-marco-black dark:text-white">
        {t('common.cart.orderSummary')}
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[var(--app-text-muted)]">{t('common.cart.subtotal')}</span>
          <span className="font-medium text-marco-black dark:text-white">
            {formatMoneyInCurrency(cart.totals.subtotal, amountCurrency, currency)}
          </span>
        </div>
        {cart.totals.discount > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[var(--app-text-muted)]">{t('common.cart.discount')}</span>
            <span className="font-medium text-success">
              -{formatMoneyInCurrency(cart.totals.discount, amountCurrency, currency)}
            </span>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[var(--app-text-muted)]">{t('common.cart.shipping')}</span>
          <span className="font-medium text-marco-black dark:text-white">{shippingLabel}</span>
        </div>
      </div>

      <div className="mt-3 border-t border-marco-border/80 pt-3 dark:border-white/10">
        <div className="flex items-center justify-between gap-3 text-base font-bold text-marco-black dark:text-white">
          <span>{t('common.cart.total')}</span>
          <span className="tabular-nums">
            {formatMoneyInCurrency(cart.totals.total, amountCurrency, currency)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        className="mt-4 flex min-h-[3rem] w-full items-center justify-center rounded-xl bg-marco-yellow px-6 text-sm font-bold uppercase tracking-wide text-marco-black transition-[filter] hover:brightness-95 active:brightness-90"
      >
        {t('common.buttons.proceedToCheckout')}
      </button>
    </div>
  );
}
