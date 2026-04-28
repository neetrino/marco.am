'use client';

import { useTranslation } from '../../../lib/i18n-client';
import { formatPriceInCurrency } from '../../../lib/currency';
import { isCourierShipping, type ShippingMethodId } from '../../../lib/constants/shipping-method';
import { Cart } from '../types';

interface OrderSummaryModalProps {
  cart: Cart | null;
  orderSummary: {
    subtotalDisplay: number;
    shippingDisplay: number;
    totalDisplay: number;
  };
  currency: 'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL';
  shippingMethod: ShippingMethodId;
  shippingCity?: string;
  loadingCheckoutTotals: boolean;
  checkoutTotalsStale?: boolean;
}

export function OrderSummaryModal({
  cart,
  orderSummary,
  currency,
  shippingMethod,
  shippingCity,
  loadingCheckoutTotals,
  checkoutTotalsStale,
}: OrderSummaryModalProps) {
  const { t } = useTranslation();

  if (!cart) {
    return null;
  }

  const shippingDisplay =
    shippingMethod === 'pickup'
      ? t('checkout.shipping.freePickup')
      : isCourierShipping(shippingMethod) && !shippingCity?.trim()
        ? t('checkout.shipping.enterCity')
        : loadingCheckoutTotals
          ? t('checkout.shipping.loading')
          : formatPriceInCurrency(orderSummary.shippingDisplay, currency) +
            (shippingCity ? ` (${shippingCity})` : ` (${t('checkout.shipping.courier')})`);

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      {checkoutTotalsStale ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-1">
          {t('checkout.messages.totalsStaleWarning')}
        </p>
      ) : null}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{t('checkout.summary.items')}:</span>
        <span className="font-medium">{cart.itemsCount}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{t('checkout.summary.subtotal')}:</span>
        <span className="font-medium">{formatPriceInCurrency(orderSummary.subtotalDisplay, currency)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{t('checkout.summary.shipping')}:</span>
        <span className="font-medium">{shippingDisplay}</span>
      </div>
      <div className="border-t border-gray-200 pt-2 mt-2">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-900">{t('checkout.summary.total')}:</span>
          <span className="font-bold text-gray-900">
            {formatPriceInCurrency(orderSummary.totalDisplay, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

