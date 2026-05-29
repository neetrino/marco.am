'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@shop/ui';
import { useTranslation } from '../../lib/i18n-client';
import { formatPriceInCurrency } from '../../lib/currency';
import { isCourierShipping, type ShippingMethodId } from '../../lib/constants/shipping-method';
import { useAuth } from '../../lib/auth/AuthContext';
import { apiClient } from '../../lib/api-client';
import {
  CHECKOUT_FIELD_LABEL_CLASS,
  CHECKOUT_INPUT_FIELD_CLASS,
  CHECKOUT_ORDER_SUMMARY_PRIMARY_BUTTON_CLASS,
  CHECKOUT_ORDER_SUMMARY_PROMO_APPLY_CLASS,
  CHECKOUT_ORDER_SUMMARY_SECONDARY_BUTTON_CLASS,
  CHECKOUT_ORDER_SUMMARY_TITLE_CLASS,
} from './checkout-form.constants';
import type { Cart } from './types';

interface OrderSummaryProps {
  cart: Cart | null;
  orderSummary: {
    subtotalDisplay: number;
    shippingDisplay: number;
    discountDisplay: number;
    totalDisplay: number;
  };
  currency: 'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL';
  shippingMethod: ShippingMethodId;
  shippingCity: string | undefined;
  loadingCheckoutTotals: boolean;
  checkoutTotalsStale?: boolean;
  error: string | null;
  isSubmitting: boolean;
  onPlaceOrder: (e?: React.FormEvent) => void;
  onCartRefresh: () => void;
}

function SummaryRow({
  label,
  value,
  valueClassName = 'font-medium text-[var(--app-text)]',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-[var(--app-text-muted)]">{label}</span>
      <span className={`tabular-nums ${valueClassName}`}>{value}</span>
    </div>
  );
}

export function OrderSummary({
  cart,
  orderSummary,
  currency,
  shippingMethod,
  shippingCity,
  loadingCheckoutTotals,
  checkoutTotalsStale,
  error,
  isSubmitting,
  onPlaceOrder,
  onCartRefresh,
}: OrderSummaryProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [promoInput, setPromoInput] = useState(cart?.couponCode ?? '');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  useEffect(() => {
    setPromoInput(cart?.couponCode ?? '');
  }, [cart?.couponCode]);

  const shippingValue =
    shippingMethod === 'pickup'
      ? t('checkout.shipping.freePickup')
      : isCourierShipping(shippingMethod) && !shippingCity?.trim()
        ? t('checkout.shipping.enterCity')
        : loadingCheckoutTotals
          ? t('checkout.shipping.loading')
          : formatPriceInCurrency(orderSummary.shippingDisplay, currency) +
            (shippingCity ? ` (${shippingCity})` : ` (${t('checkout.shipping.courier')})`);

  const handleApplyPromo = async () => {
    if (!isLoggedIn) {
      setPromoError(t('common.cart.promoLoginRequired'));
      return;
    }

    setApplyingPromo(true);
    setPromoError(null);
    try {
      await apiClient.put('/api/v1/cart/coupon', { couponCode: promoInput.trim() });
      onCartRefresh();
      window.dispatchEvent(new Event('cart-updated'));
    } catch {
      setPromoError(t('common.cart.promoApplyFailed'));
    } finally {
      setApplyingPromo(false);
    }
  };

  return (
    <div className="lg:col-span-1">
      <div className="pb-5 lg:sticky lg:top-28 lg:z-10">
        <div className="checkout-order-summary-receipt-shell">
          <div className="cart-order-summary-receipt">
            <h2 className={`mb-5 ${CHECKOUT_ORDER_SUMMARY_TITLE_CLASS}`}>
              {t('checkout.orderSummary')}
            </h2>

            <div className="mb-5">
              <label htmlFor="checkout-promo-code" className={CHECKOUT_FIELD_LABEL_CLASS}>
                {t('common.cart.promoCode')}
              </label>
              <div className="flex gap-2">
                <input
                  id="checkout-promo-code"
                  type="text"
                  value={promoInput}
                  onChange={(event) => {
                    setPromoInput(event.target.value);
                    if (promoError) {
                      setPromoError(null);
                    }
                  }}
                  placeholder={t('common.cart.promoCodePlaceholder')}
                  disabled={isSubmitting || applyingPromo}
                  className={`min-w-0 flex-1 placeholder:text-[var(--app-text-soft)] disabled:opacity-60 ${CHECKOUT_INPUT_FIELD_CLASS}`}
                />
                <button
                  type="button"
                  onClick={() => void handleApplyPromo()}
                  disabled={isSubmitting || applyingPromo || !promoInput.trim()}
                  className={CHECKOUT_ORDER_SUMMARY_PROMO_APPLY_CLASS}
                >
                  {t('common.cart.applyPromo')}
                </button>
              </div>
              {promoError ? (
                <p className="mt-2 text-sm text-error">{promoError}</p>
              ) : null}
            </div>

            {checkoutTotalsStale ? (
              <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                {t('checkout.messages.totalsStaleWarning')}
              </p>
            ) : null}

            <div className="space-y-3">
              <SummaryRow
                label={t('checkout.summary.subtotal')}
                value={formatPriceInCurrency(orderSummary.subtotalDisplay, currency)}
              />
              {orderSummary.discountDisplay > 0 ? (
                <SummaryRow
                  label={t('common.cart.discount')}
                  value={`-${formatPriceInCurrency(orderSummary.discountDisplay, currency)}`}
                  valueClassName="font-medium text-success"
                />
              ) : null}
              <SummaryRow label={t('checkout.summary.shipping')} value={shippingValue} />
            </div>

            <div className="mt-4 border-t border-marco-border/80 pt-4 dark:border-white/10">
              <div className="flex items-center justify-between gap-3 text-base font-bold text-[var(--app-text)]">
                <span>{t('checkout.summary.total')}</span>
                <span className="tabular-nums">
                  {formatPriceInCurrency(orderSummary.totalDisplay, currency)}
                </span>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-error/30 bg-error/10 px-3 py-2">
                <p className="text-sm text-error">{error}</p>
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                onClick={onPlaceOrder}
                className={CHECKOUT_ORDER_SUMMARY_PRIMARY_BUTTON_CLASS}
              >
                {isSubmitting ? t('checkout.buttons.processing') : t('checkout.buttons.placeOrder')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => router.push('/products')}
                className={CHECKOUT_ORDER_SUMMARY_SECONDARY_BUTTON_CLASS}
              >
                {t('common.buttons.browseProducts')}
              </Button>
            </div>
          </div>
          <div className="cart-order-summary-receipt-edge" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
