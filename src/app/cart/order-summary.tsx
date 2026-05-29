'use client';

import { useEffect, useState } from 'react';
import { Button } from '@shop/ui';
import { apiClient, getClientErrorDetail } from '../../lib/api-client';
import { coerceCurrencyCode, formatMoneyInCurrency, type CurrencyCode } from '../../lib/currency';
import type { Cart } from './types';

interface OrderSummaryProps {
  cart: Cart;
  currency: string;
  isLoggedIn: boolean;
  onCouponApplied: () => Promise<void>;
  t: (key: string) => string;
}

export function OrderSummary({
  cart,
  currency,
  isLoggedIn,
  onCouponApplied,
  t,
}: OrderSummaryProps) {
  const currencyCode = currency as CurrencyCode;
  const amountCurrency = coerceCurrencyCode(cart.totals.currency, 'AMD');
  const [promoInput, setPromoInput] = useState(cart.couponCode ?? '');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    setPromoInput(cart.couponCode ?? '');
  }, [cart.couponCode]);

  async function handleApplyPromo() {
    const code = promoInput.trim();
    if (!code) {
      return;
    }
    if (!isLoggedIn) {
      setPromoError(t('common.cart.promoLoginRequired'));
      return;
    }

    setApplyingPromo(true);
    setPromoError(null);
    try {
      await apiClient.put('/api/v1/cart/coupon', { couponCode: code });
      await onCouponApplied();
    } catch (error: unknown) {
      setPromoError(getClientErrorDetail(error) ?? t('common.cart.promoApplyFailed'));
    } finally {
      setApplyingPromo(false);
    }
  }

  return (
    <div className="lg:col-span-1">
      <div className="pb-5 lg:sticky lg:top-24">
        <div className="cart-order-summary-receipt">
          <h2 className="mb-6 text-xl font-bold text-marco-black">
            {t('common.cart.orderSummary')}
          </h2>

          <div className="mb-6">
            <label
              htmlFor="cart-promo-code"
              className="mb-2 block text-sm font-medium text-[var(--app-text-muted)]"
            >
              {t('common.cart.promoCode')}
            </label>
            <div className="flex gap-2">
              <input
                id="cart-promo-code"
                type="text"
                value={promoInput}
                onChange={(event) => {
                  setPromoInput(event.target.value);
                  if (promoError) {
                    setPromoError(null);
                  }
                }}
                placeholder={t('common.cart.promoCodePlaceholder')}
                className="h-11 min-w-0 flex-1 rounded-xl border border-marco-border bg-[var(--app-surface)] px-3 text-sm text-marco-black placeholder:text-[var(--app-text-soft)] focus:border-marco-black focus:outline-none focus:ring-2 focus:ring-marco-black/15"
              />
              <button
                type="button"
                onClick={() => void handleApplyPromo()}
                disabled={applyingPromo || !promoInput.trim()}
                className="h-11 shrink-0 rounded-xl bg-marco-black px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('common.cart.applyPromo')}
              </button>
            </div>
            {promoError ? (
              <p className="mt-2 text-sm text-error" role="alert">
                {promoError}
              </p>
            ) : null}
          </div>

          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-[var(--app-text-muted)]">{t('common.cart.subtotal')}</span>
              <span className="font-medium text-marco-black">
                {formatMoneyInCurrency(cart.totals.subtotal, amountCurrency, currencyCode)}
              </span>
            </div>
            {cart.totals.discount > 0 ? (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-[var(--app-text-muted)]">{t('common.cart.discount')}</span>
                <span className="font-medium text-success">
                  -{formatMoneyInCurrency(cart.totals.discount, amountCurrency, currencyCode)}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-[var(--app-text-muted)]">{t('common.cart.shipping')}</span>
              <span className="font-medium text-marco-black">
                {formatMoneyInCurrency(cart.totals.shipping, amountCurrency, currencyCode)}
              </span>
            </div>
          </div>

          <div className="mb-6 border-t border-marco-border pt-4">
            <div className="flex items-center justify-between gap-4 text-lg font-bold text-marco-black">
              <span>{t('common.cart.total')}</span>
              <span>
                {formatMoneyInCurrency(cart.totals.total, amountCurrency, currencyCode)}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            className="!h-12 w-full !rounded-xl !text-base !font-bold"
            size="lg"
            onClick={() => {
              window.location.href = '/checkout';
            }}
          >
            {t('common.buttons.proceedToCheckout')}
          </Button>
          <Button
            variant="outline"
            className="mt-3 !h-11 w-full !rounded-xl !border-2 !border-marco-black !font-bold !text-marco-black hover:!bg-marco-gray"
            size="md"
            onClick={() => {
              window.location.href = '/products';
            }}
          >
            {t('common.buttons.browseProducts')}
          </Button>
        </div>
        <div className="cart-order-summary-receipt-edge" aria-hidden="true" />
      </div>
    </div>
  );
}
