'use client';

import { Card, Input, Textarea } from '@shop/ui';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { useTranslation } from '../../lib/i18n-client';
import type { CheckoutPaymentMethodId } from '../../lib/constants/checkout-payment-method';
import { CheckoutFormData } from './types';
import type { PaymentMethod } from './utils/payment-methods';
import { PaymentMethodOptionGraphic } from './components/PaymentMethodOptionGraphic';

interface CheckoutFormProps {
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  isSubmitting: boolean;
  paymentMethod: CheckoutPaymentMethodId;
  paymentMethods: PaymentMethod[];
  logoErrors: Record<string, boolean>;
  setLogoErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  deliveryCities: string[];
  loadingDeliveryCities: boolean;
}

export function CheckoutForm({
  register,
  setValue,
  errors,
  isSubmitting,
  paymentMethod,
  paymentMethods,
  logoErrors,
  setLogoErrors,
  error,
  setError,
  deliveryCities,
  loadingDeliveryCities,
}: CheckoutFormProps) {
  const { t } = useTranslation();

  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Contact Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('checkout.contactInformation')}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('checkout.form.firstName')}
              type="text"
              required
              {...register('firstName')}
              error={errors.firstName?.message}
              disabled={isSubmitting}
            />
            <Input
              label={t('checkout.form.lastName')}
              type="text"
              required
              {...register('lastName')}
              error={errors.lastName?.message}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('checkout.form.email')}
              type="email"
              required
              {...register('email')}
              error={errors.email?.message}
              disabled={isSubmitting}
            />
            <Input
              label={t('checkout.form.phone')}
              type="tel"
              required
              placeholder={t('checkout.placeholders.phone')}
              {...register('phone')}
              error={errors.phone?.message}
              disabled={isSubmitting}
            />
          </div>
          <Textarea
            label={t('checkout.form.notes')}
            placeholder={t('checkout.placeholders.notes')}
            {...register('notes')}
            error={errors.notes?.message}
            disabled={isSubmitting}
            rows={4}
          />
        </div>
      </Card>

      {/* Shipping address — courier only; no separate “delivery method” step */}
      <Card className="p-6" data-shipping-section>
        <h2 className="mb-6 text-xl font-semibold text-gray-900">{t('checkout.shippingAddress')}</h2>
        {error || errors.shippingAddress || errors.shippingCity || errors.shippingMethod ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">
              {errors.shippingMethod?.message ||
                errors.shippingAddress?.message ||
                errors.shippingCity?.message ||
                error}
            </p>
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Input
              label={t('checkout.form.address')}
              type="text"
              required
              placeholder={t('checkout.placeholders.address')}
              {...register('shippingAddress', {
                onChange: () => {
                  if (error) {
                    setError(null);
                  }
                },
              })}
              error={errors.shippingAddress?.message}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
              {t('checkout.form.city')}
              <span className="text-error" aria-hidden="true">
                {' '}
                *
              </span>
            </label>
            <select
              {...register('shippingCity', {
                onChange: () => {
                  if (error) {
                    setError(null);
                  }
                },
              })}
              aria-required
              disabled={isSubmitting || loadingDeliveryCities}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-200 dark:focus:ring-slate-200/20 dark:disabled:bg-slate-800 ${
                errors.shippingCity?.message ? 'border-error focus:ring-error' : 'border-gray-300'
              }`}
            >
              <option value="">
                {loadingDeliveryCities
                  ? t('checkout.shipping.loading')
                  : t('checkout.shipping.selectCity')}
              </option>
              {!loadingDeliveryCities &&
                deliveryCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              {!loadingDeliveryCities && deliveryCities.length === 0 ? (
                <option value="" disabled>
                  {t('checkout.shipping.noCitiesAvailable')}
                </option>
              ) : null}
            </select>
            {errors.shippingCity?.message ? (
              <p className="mt-1 text-sm text-error">{errors.shippingCity.message}</p>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="rounded-2xl border border-sky-100 bg-sky-50 p-6 shadow-[0_1px_3px_rgba(14,116,144,0.08)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
        <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-slate-100">
          {t('checkout.paymentMethod')}
        </h2>
        {errors.paymentMethod && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{errors.paymentMethod.message}</p>
          </div>
        )}
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className={`flex cursor-pointer items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-400 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-sky-50 dark:border-slate-700 dark:bg-slate-950 dark:has-[:focus-visible]:ring-offset-slate-900 ${
                paymentMethod === method.id
                  ? 'border-sky-400 ring-1 ring-sky-200 dark:border-sky-500 dark:ring-sky-900'
                  : 'border-gray-200 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                {...register('paymentMethod')}
                value={method.id}
                checked={paymentMethod === method.id}
                onChange={(e) =>
                  setValue('paymentMethod', e.target.value as CheckoutPaymentMethodId)
                }
                className="sr-only"
                disabled={isSubmitting}
              />
              <PaymentMethodOptionGraphic
                method={method}
                hasLogoError={Boolean(logoErrors[method.id])}
                onLogoError={() => {
                  setLogoErrors((prev) => ({ ...prev, [method.id]: true }));
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900 dark:text-slate-100">{method.name}</div>
                <div className="text-sm text-gray-500 dark:text-slate-400">{method.description}</div>
              </div>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}



