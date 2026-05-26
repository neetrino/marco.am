'use client';

import { Card } from '@shop/ui';
import { formatPriceInCurrency, convertPrice, type CurrencyCode } from '@/lib/currency';
import { isCourierShipping } from '@/lib/constants/shipping-method';
import {
  getStatusColor,
  getPaymentStatusColor,
  getFulfillmentStatusColor,
  getColorValue,
} from '../utils';
import type { OrderDetails } from '../types';

type OrderDetailsBodyProps = {
  order: OrderDetails;
  currency: CurrencyCode;
  t: (key: string) => string;
};

function getAttributeLabel(key: string, t: (key: string) => string): string {
  if (key === 'color' || key === 'colour') {
    return t('profile.orderDetails.color');
  }
  if (key === 'size') {
    return t('profile.orderDetails.size');
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function getColorsArray(colors: unknown): string[] {
  if (!colors) {
    return [];
  }
  if (Array.isArray(colors)) {
    return colors;
  }
  if (typeof colors === 'string') {
    try {
      const parsed = JSON.parse(colors);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function formatStoredAmount(
  amount: number,
  currency: CurrencyCode,
  treatAsUsd = true
): string {
  const amountAmd = treatAsUsd ? convertPrice(amount, 'USD', 'AMD') : amount;
  const display = currency === 'AMD' ? amountAmd : convertPrice(amountAmd, 'AMD', currency);
  return formatPriceInCurrency(display, currency);
}

export function OrderDetailsBody({ order, currency, t }: OrderDetailsBodyProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            {t('profile.orderDetails.orderStatus')}
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(order.status)}`}
            >
              {order.status}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}
            >
              {t('profile.orderDetails.payment')}: {order.paymentStatus}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${getFulfillmentStatusColor(order.fulfillmentStatus)}`}
            >
              {t('profile.orderDetails.fulfillment')}: {order.fulfillmentStatus}
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">
            {t('profile.orderDetails.orderItems')}
          </h3>
          <div className="space-y-4">
            {order.items.map((item, index) => {
              const allOptions = item.variantOptions ?? [];

              return (
                <div
                  key={`${item.sku}-${index}`}
                  className="flex gap-4 border-b border-gray-200 pb-4 last:border-0"
                >
                  {item.imageUrl ? (
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={item.imageUrl}
                        alt={item.productTitle}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <h4 className="mb-1 text-lg font-semibold text-gray-900">{item.productTitle}</h4>
                    {allOptions.length > 0 ? (
                      <div className="mb-2 mt-2 flex flex-wrap gap-3">
                        {allOptions.map((opt, optIndex) => {
                          if (!opt.attributeKey || !opt.value) {
                            return null;
                          }

                          const attributeKey = opt.attributeKey.toLowerCase().trim();
                          const isColor =
                            attributeKey === 'color' || attributeKey === 'colour';
                          const displayLabel = opt.label || opt.value;
                          const hasImage = Boolean(opt.imageUrl?.trim());
                          const colors = getColorsArray(opt.colors);
                          const colorHex =
                            colors.length > 0
                              ? colors[0]
                              : isColor
                                ? getColorValue(opt.value)
                                : null;

                          return (
                            <div key={optIndex} className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">
                                {getAttributeLabel(opt.attributeKey, t)}:
                              </span>
                              <div className="flex items-center gap-2">
                                {hasImage ? (
                                  <img
                                    src={opt.imageUrl}
                                    alt={displayLabel}
                                    className="h-6 w-6 rounded border border-gray-300 object-cover"
                                    onError={(event) => {
                                      (event.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : isColor && colorHex ? (
                                  <div
                                    className="h-5 w-5 rounded-full border border-gray-300"
                                    style={{ backgroundColor: colorHex }}
                                    title={displayLabel}
                                  />
                                ) : null}
                                <span className="text-sm capitalize text-gray-900">
                                  {displayLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    <p className="text-sm text-gray-600">
                      {t('profile.orderDetails.sku')}: {item.sku}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      {t('profile.orderDetails.quantity')}: {item.quantity} ×{' '}
                      {formatStoredAmount(item.price, currency)} ={' '}
                      {formatStoredAmount(item.total, currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="sticky top-4 p-6">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">
            {t('profile.orderDetails.orderSummary')}
          </h3>
          <div className="mb-6 space-y-4">
            {order.totals ? (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>{t('profile.orderDetails.subtotal')}</span>
                  <span>{formatStoredAmount(order.totals.subtotal, currency)}</span>
                </div>
                {order.totals.discount > 0 ? (
                  <div className="flex justify-between text-gray-600">
                    <span>{t('profile.orderDetails.discount')}</span>
                    <span>-{formatStoredAmount(order.totals.discount, currency)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-gray-600">
                  <span>{t('profile.orderDetails.shipping')}</span>
                  <span>
                    {order.shippingMethod === 'pickup'
                      ? t('checkout.shipping.freePickup')
                      : formatStoredAmount(order.totals.shipping, currency, false)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>{t('profile.orderDetails.total')}</span>
                    <span>
                      {formatStoredAmount(
                        order.totals.subtotal -
                          order.totals.discount +
                          order.totals.shipping,
                        currency,
                        false
                      )}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-600">{t('profile.orderDetails.loadingTotals')}</div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            {t('profile.orderDetails.shippingMethod')}
          </h3>
          <div className="space-y-3 text-gray-700">
            <div>
              <span className="font-medium">{t('profile.orderDetails.method')}: </span>
              <span className="capitalize">
                {isCourierShipping(order.shippingMethod)
                  ? t('profile.orderDetails.delivery')
                  : order.shippingMethod === 'pickup'
                    ? t('profile.orderDetails.pickup')
                    : order.shippingMethod || t('profile.orderDetails.notSpecified')}
              </span>
            </div>
            {isCourierShipping(order.shippingMethod) && order.shippingAddress ? (
              <div className="mt-3 border-t border-gray-200 pt-3">
                <p className="mb-2 font-medium text-gray-900">
                  {t('profile.orderDetails.deliveryAddress')}:
                </p>
                <div className="text-gray-600">
                  {order.shippingAddress.firstName && order.shippingAddress.lastName ? (
                    <p>
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                  ) : null}
                  {order.shippingAddress.addressLine1 ? (
                    <p>{order.shippingAddress.addressLine1}</p>
                  ) : null}
                  {order.shippingAddress.addressLine2 ? (
                    <p>{order.shippingAddress.addressLine2}</p>
                  ) : null}
                  {order.shippingAddress.city ? (
                    <p>
                      {order.shippingAddress.city}
                      {order.shippingAddress.postalCode
                        ? `, ${order.shippingAddress.postalCode}`
                        : ''}
                    </p>
                  ) : null}
                  {order.shippingAddress.countryCode ? (
                    <p>{order.shippingAddress.countryCode}</p>
                  ) : null}
                  {order.shippingAddress.phone ? (
                    <p className="mt-2">
                      {t('profile.orderDetails.phone')}: {order.shippingAddress.phone}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
