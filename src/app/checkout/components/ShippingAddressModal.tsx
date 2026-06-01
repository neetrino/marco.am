'use client';

import { Button, Input } from '@shop/ui';
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { useTranslation } from '../../../lib/i18n-client';
import { ContactInformation } from './ContactInformation';
import { OrderSummaryModal } from './OrderSummaryModal';
import type { PickupBranchId } from '../../../lib/constants/pickup-branches';
import type { PickupBranch } from '../../../lib/constants/pickup-branches';
import type { CheckoutPaymentMethodId } from '../../../lib/constants/checkout-payment-method';
import type { ShippingMethodId } from '../../../lib/constants/shipping-method';
import type { CheckoutFormData, Cart } from '../types';
import type { CheckoutHandleSubmit } from '../useCheckout';
import { CheckoutSelectMenu } from './CheckoutSelectMenu';
import {
  CHECKOUT_FIELD_CELL_CLASS,
  CHECKOUT_FIELD_ROW_CLASS,
  CHECKOUT_INPUT_FIELD_CLASS,
} from '../checkout-form.constants';

interface ShippingAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  register: UseFormRegister<CheckoutFormData>;
  handleSubmit: CheckoutHandleSubmit;
  setValue: UseFormSetValue<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  isSubmitting: boolean;
  shippingMethod: ShippingMethodId;
  paymentMethod: CheckoutPaymentMethodId;
  cart: Cart | null;
  orderSummary: {
    subtotalDisplay: number;
    shippingDisplay: number;
    totalDisplay: number;
  };
  currency: 'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL';
  shippingCity?: string;
  pickupBranchId?: string;
  loadingCheckoutTotals: boolean;
  checkoutTotalsStale?: boolean;
  deliveryCities: string[];
  loadingDeliveryCities: boolean;
  pickupBranches: PickupBranch[];
  onSubmit: (data: CheckoutFormData) => void;
}

export function ShippingAddressModal({
  isOpen,
  onClose,
  register,
  handleSubmit,
  setValue,
  errors,
  isSubmitting,
  shippingMethod,
  paymentMethod,
  cart,
  orderSummary,
  currency,
  shippingCity,
  pickupBranchId,
  loadingCheckoutTotals,
  checkoutTotalsStale,
  deliveryCities,
  loadingDeliveryCities,
  pickupBranches,
  onSubmit,
}: ShippingAddressModalProps) {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  const handleValidationError = (validationErrors: FieldErrors<CheckoutFormData>) => {
    const firstErrorField = Object.keys(validationErrors)[0];
    if (firstErrorField) {
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="z-[10000] bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {shippingMethod === 'courier' 
              ? t('checkout.modals.completeOrder') 
              : t('checkout.modals.confirmOrder')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t('checkout.modals.closeModal')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <ContactInformation
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
        />

        {shippingMethod === 'courier' ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.shippingAddress')}</h3>
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
                    {...register('shippingAddress')}
                    error={errors.shippingAddress?.message}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {(errors.shippingAddress || errors.shippingCity) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">
                  {errors.shippingAddress?.message || errors.shippingCity?.message}
                </p>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 mt-6">
                <p className="text-sm text-green-800">
                  <strong>{t('checkout.payment.cash')}:</strong> {t('checkout.messages.cashOnDeliveryInfo')}
                </p>
              </div>
            )}

            <OrderSummaryModal
              cart={cart}
              orderSummary={orderSummary}
              currency={currency}
              shippingMethod={shippingMethod}
              shippingCity={shippingCity}
              loadingCheckoutTotals={loadingCheckoutTotals}
              checkoutTotalsStale={checkoutTotalsStale}
            />
          </>
        ) : (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('checkout.shippingMethod')}</h3>
            <input type="hidden" {...register('pickupBranchId')} />
            <CheckoutSelectMenu
              label={t('checkout.form.branchAddress')}
              placeholder={t('checkout.shipping.selectBranch')}
              options={pickupBranches.map((branch) => ({
                value: branch.id,
                label: branch.label,
              }))}
              value={pickupBranchId ?? ''}
              onChange={(nextValue) => {
                setValue('pickupBranchId', nextValue as PickupBranchId, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
              disabled={isSubmitting}
              required
              showMapPin
              menuTitle={t('checkout.shipping.selectBranch')}
              error={errors.pickupBranchId?.message}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>{t('checkout.shipping.storePickup')}:</strong> {t('checkout.messages.storePickupInfo')}
              </p>
            </div>

            {paymentMethod === 'cash' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  <strong>{t('checkout.payment.cash')}:</strong> {t('checkout.messages.cashOnDeliveryPickup')}
                </p>
              </div>
            )}

            <OrderSummaryModal
              cart={cart}
              orderSummary={orderSummary}
              currency={currency}
              shippingMethod={shippingMethod}
              shippingCity={shippingCity}
              loadingCheckoutTotals={loadingCheckoutTotals}
              checkoutTotalsStale={checkoutTotalsStale}
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t('checkout.buttons.cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            onClick={handleSubmit(
              (data) => {
                onClose();
                onSubmit(data as unknown as CheckoutFormData);
              },
              handleValidationError
            )}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('checkout.buttons.processing') : t('checkout.buttons.placeOrder')}
          </Button>
        </div>
      </div>
    </div>
  );
}

