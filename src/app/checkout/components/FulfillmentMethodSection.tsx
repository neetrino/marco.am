'use client';

import { Input } from '@shop/ui';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { useTranslation } from '../../../lib/i18n-client';
import type { PickupBranch } from '../../../lib/constants/pickup-branches';
import type { PickupBranchId } from '../../../lib/constants/pickup-branches';
import type { ShippingMethodId } from '../../../lib/constants/shipping-method';
import { CheckoutFormData } from '../types';
import {
  CHECKOUT_FULFILLMENT_TOGGLE_ACTIVE_CLASS,
  CHECKOUT_FULFILLMENT_TOGGLE_INACTIVE_CLASS,
  CHECKOUT_FIELD_CELL_CLASS,
  CHECKOUT_FIELD_ROW_CLASS,
  CHECKOUT_INPUT_FIELD_CLASS,
} from '../checkout-form.constants';
import { CheckoutSelectMenu } from './CheckoutSelectMenu';

interface FulfillmentMethodSectionProps {
  register: UseFormRegister<CheckoutFormData>;
  setValue: UseFormSetValue<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  isSubmitting: boolean;
  shippingMethod: ShippingMethodId;
  pickupBranches: PickupBranch[];
  pickupBranchId: string;
  shippingCity: string;
  deliveryCities: string[];
  loadingDeliveryCities: boolean;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function FulfillmentMethodSection({
  register,
  setValue,
  errors,
  isSubmitting,
  shippingMethod,
  pickupBranches,
  pickupBranchId,
  shippingCity,
  deliveryCities,
  loadingDeliveryCities,
  error,
  setError,
}: FulfillmentMethodSectionProps) {
  const { t } = useTranslation();
  const isPickup = shippingMethod === 'pickup';

  const handleMethodChange = (method: ShippingMethodId) => {
    setValue('shippingMethod', method, { shouldValidate: true, shouldDirty: true });
    if (method === 'pickup') {
      setValue('shippingAddress', '', { shouldValidate: true });
      setValue('shippingCity', '', { shouldValidate: true });
    } else {
      setValue('pickupBranchId', '', { shouldValidate: true });
    }
    if (error) {
      setError(null);
    }
  };

  return (
    <div data-shipping-section>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => handleMethodChange('pickup')}
          disabled={isSubmitting}
          className={`rounded-xl border px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
            isPickup ? CHECKOUT_FULFILLMENT_TOGGLE_ACTIVE_CLASS : CHECKOUT_FULFILLMENT_TOGGLE_INACTIVE_CLASS
          }`}
        >
          {t('checkout.shipping.pickupToggle')}
        </button>
        <button
          type="button"
          onClick={() => handleMethodChange('courier')}
          disabled={isSubmitting}
          className={`rounded-xl border px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
            !isPickup ? CHECKOUT_FULFILLMENT_TOGGLE_ACTIVE_CLASS : CHECKOUT_FULFILLMENT_TOGGLE_INACTIVE_CLASS
          }`}
        >
          {t('checkout.shipping.deliveryToggle')}
        </button>
      </div>

      <input type="hidden" {...register('shippingMethod')} />

      {error ||
      errors.shippingAddress ||
      errors.shippingCity ||
      errors.pickupBranchId ||
      errors.shippingMethod ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">
            {errors.shippingMethod?.message ||
              errors.pickupBranchId?.message ||
              errors.shippingAddress?.message ||
              errors.shippingCity?.message ||
              error}
          </p>
        </div>
      ) : null}

      {isPickup ? (
        <div>
          <input type="hidden" {...register('pickupBranchId')} />
          <CheckoutSelectMenu
            label={t('checkout.form.branchAddress')}
            placeholder={t('checkout.shipping.selectBranch')}
            options={pickupBranches.map((branch) => ({
              value: branch.id,
              label: branch.label,
            }))}
            value={pickupBranchId}
            onChange={(nextValue) => {
              setValue('pickupBranchId', nextValue as PickupBranchId, {
                shouldValidate: true,
                shouldDirty: true,
              });
              if (error) {
                setError(null);
              }
            }}
            disabled={isSubmitting}
            required
            showMapPin
            menuTitle={t('checkout.shipping.selectBranch')}
            error={errors.pickupBranchId?.message}
          />
        </div>
      ) : (
        <div className={CHECKOUT_FIELD_ROW_CLASS}>
          <div className={CHECKOUT_FIELD_CELL_CLASS}>
            <input type="hidden" {...register('shippingCity')} />
            <CheckoutSelectMenu
              label={t('checkout.form.city')}
              placeholder={
                loadingDeliveryCities
                  ? t('checkout.shipping.loading')
                  : t('checkout.shipping.selectCity')
              }
              options={deliveryCities.map((city) => ({
                value: city,
                label: city,
              }))}
              value={shippingCity ?? ''}
              onChange={(nextValue) => {
                setValue('shippingCity', nextValue, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                if (error) {
                  setError(null);
                }
              }}
              disabled={isSubmitting || loadingDeliveryCities || deliveryCities.length === 0}
              required
              error={errors.shippingCity?.message}
            />
          </div>
          <div className={CHECKOUT_FIELD_CELL_CLASS}>
            <Input
              label={t('checkout.form.address')}
              type="text"
              required
              placeholder={t('checkout.placeholders.address')}
              className={CHECKOUT_INPUT_FIELD_CLASS}
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
        </div>
      )}
    </div>
  );
}
