'use client';

import { Card, Input, Textarea } from '@shop/ui';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { useTranslation } from '../../lib/i18n-client';
import type { CheckoutPaymentMethodId } from '../../lib/constants/checkout-payment-method';
import type { ShippingMethodId } from '../../lib/constants/shipping-method';
import { CheckoutFormData } from './types';
import type { PaymentMethod } from './utils/payment-methods';
import { PaymentMethodOptionGraphic } from './components/PaymentMethodOptionGraphic';

interface CheckoutFormProps {
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  isSubmitting: boolean;
  shippingMethod: ShippingMethodId;
  paymentMethod: CheckoutPaymentMethodId;
  paymentMethods: PaymentMethod[];
  logoErrors: Record<string, boolean>;
  setLogoErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function CheckoutForm({
  register,
  setValue,
  errors,
  isSubmitting,
  shippingMethod,
  paymentMethod,
  paymentMethods,
  logoErrors,
  setLogoErrors,
  error,
  setError,
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
              {...register('firstName')}
              error={errors.firstName?.message}
              disabled={isSubmitting}
            />
            <Input
              label={t('checkout.form.lastName')}
              type="text"
              {...register('lastName')}
              error={errors.lastName?.message}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('checkout.form.email')}
              type="email"
              {...register('email')}
              error={errors.email?.message}
              disabled={isSubmitting}
            />
            <Input
              label={t('checkout.form.phone')}
              type="tel"
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

      {/* Shipping Method */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('checkout.shippingMethod')}</h2>
        {errors.shippingMethod && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.shippingMethod.message}</p>
          </div>
        )}
        <div className="space-y-3">
          <label
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              shippingMethod === 'pickup'
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              {...register('shippingMethod')}
              value="pickup"
              checked={shippingMethod === 'pickup'}
              onChange={(e) => setValue('shippingMethod', e.target.value as ShippingMethodId)}
              className="mr-4"
              disabled={isSubmitting}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{t('checkout.shipping.storePickup')}</div>
              <div className="text-sm text-gray-600">{t('checkout.shipping.storePickupDescription')}</div>
            </div>
          </label>
          <label
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              shippingMethod === 'courier'
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              {...register('shippingMethod')}
              value="courier"
              checked={shippingMethod === 'courier'}
              onChange={(e) => setValue('shippingMethod', e.target.value as ShippingMethodId)}
              className="mr-4"
              disabled={isSubmitting}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{t('checkout.shipping.courier')}</div>
              <div className="text-sm text-gray-600">{t('checkout.shipping.courierDescription')}</div>
            </div>
          </label>
        </div>
      </Card>

      {/* Shipping Address — courier only */}
      {shippingMethod === 'courier' && (
        <Card className="p-6" data-shipping-section>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('checkout.shippingAddress')}</h2>
          {(error || errors.shippingAddress || errors.shippingCity) ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                {errors.shippingAddress?.message ||
                  errors.shippingCity?.message ||
                  error}
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label={t('checkout.form.address')}
                type="text"
                placeholder={t('checkout.placeholders.address')}
                {...register('shippingAddress', {
                  onChange: () => {
                    if (error) {
                      setError(null);
                    }
                  }
                })}
                error={errors.shippingAddress?.message}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Input
                label={t('checkout.form.city')}
                type="text"
                placeholder={t('checkout.placeholders.city')}
                {...register('shippingCity', {
                  onChange: () => {
                    if (error) {
                      setError(null);
                    }
                  }
                })}
                error={errors.shippingCity?.message}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </Card>
      )}

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



