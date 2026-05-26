'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, Phone } from 'lucide-react';
import { Button } from '@shop/ui';
import { getStoredCurrency } from '@/lib/currency';
import { useTranslation } from '@/lib/i18n-client';
import { phoneToTelHref } from '@/lib/contact-locations';
import { OrderDetailsBody } from '@/app/profile/components/OrderDetailsBody';
import { useOrderSuccessDetails } from './useOrderSuccessDetails';

export function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const orderNumber = searchParams.get('order')?.trim() ?? '';
  const { order, loading, error } = useOrderSuccessDetails(orderNumber);
  const currency = getStoredCurrency();
  const phoneDisplay = t('contact.phone').trim();
  const phoneHref = phoneToTelHref(phoneDisplay);

  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="mx-auto w-full max-w-6xl px-1">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/15"
            aria-hidden="true"
          >
            <Check className="h-8 w-8 text-success" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-marco-black sm:text-3xl">
            {t('checkout.success.title')}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
            {t('checkout.success.subtitle')}
          </p>
        </div>

        {orderNumber ? (
          <div className="mb-6 rounded-2xl border border-marco-border bg-white px-6 py-5 shadow-sm">
            <h2 className="text-xl font-bold text-marco-black sm:text-2xl">
              {t('profile.orderDetails.title')}
              {orderNumber}
            </h2>
            {order ? (
              <p className="mt-1 text-sm text-gray-600">
                {t('profile.orderDetails.placedOn')}{' '}
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div className="mb-8 rounded-2xl border border-marco-border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-marco-black" />
            <p className="text-gray-600">{t('profile.orderDetails.loading')}</p>
          </div>
        ) : null}

        {!loading && order ? (
          <div className="mb-8">
            <OrderDetailsBody order={order} currency={currency} t={t} />
          </div>
        ) : null}

        {!loading && !order ? (
          <div className="mb-8 rounded-2xl border border-marco-border bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-600">
              {error === 'failed_to_load'
                ? t('profile.orderDetails.failedToLoad')
                : t('checkout.success.ourOrders.description')}
            </p>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mt-5 border-marco-yellow text-marco-black hover:bg-marco-yellow/10"
              onClick={() => router.push('/profile?tab=orders')}
            >
              {t('checkout.success.ourOrders.viewOrders')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        ) : null}

        <section
          className="mb-8 rounded-2xl bg-marco-yellow/10 p-6"
          aria-labelledby="order-success-help"
        >
          <h2 id="order-success-help" className="font-bold text-marco-black">
            {t('checkout.success.help.title')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {t('checkout.success.help.description')}
          </p>
          <a
            href={phoneHref}
            className="mt-4 inline-flex items-center gap-2 font-semibold text-marco-black transition-colors hover:text-marco-black/80"
          >
            <Phone className="h-5 w-5 shrink-0 text-marco-black" aria-hidden="true" />
            <span>{phoneDisplay}</span>
          </a>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full sm:flex-1"
            onClick={() => router.push('/products')}
          >
            {t('checkout.success.buttons.orderAgain')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full border-marco-yellow text-marco-black hover:bg-marco-yellow/10 sm:flex-1"
            onClick={() => router.push('/')}
          >
            {t('checkout.success.buttons.home')}
          </Button>
        </div>
      </div>
    </div>
  );
}
