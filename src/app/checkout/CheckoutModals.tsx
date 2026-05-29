'use client';

import { UseFormRegister, UseFormSetValue, FieldErrors } from "react-hook-form";
import { ShippingAddressModal } from './components/ShippingAddressModal';
import type { CheckoutPaymentMethodId } from '../../lib/constants/checkout-payment-method';
import type { ShippingMethodId } from '../../lib/constants/shipping-method';
import type { PickupBranch } from '../../lib/constants/pickup-branches';
import type { CheckoutFormData, Cart } from './types';
import type { CheckoutHandleSubmit } from './useCheckout';

interface CheckoutModalsProps {
  showShippingModal: boolean;
  setShowShippingModal: (show: boolean) => void;
  register: UseFormRegister<CheckoutFormData>;
  handleSubmit: CheckoutHandleSubmit;
  setValue: UseFormSetValue<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  isSubmitting: boolean;
  shippingMethod: ShippingMethodId;
  paymentMethod: CheckoutPaymentMethodId;
  shippingCity: string | undefined;
  pickupBranchId: string | undefined;
  cart: Cart | null;
  orderSummary: {
    subtotalDisplay: number;
    shippingDisplay: number;
    totalDisplay: number;
  };
  currency: 'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL';
  loadingCheckoutTotals: boolean;
  checkoutTotalsStale?: boolean;
  deliveryCities: string[];
  loadingDeliveryCities: boolean;
  pickupBranches: PickupBranch[];
  onSubmit: (data: CheckoutFormData) => void;
}

export function CheckoutModals({
  showShippingModal,
  setShowShippingModal,
  register,
  handleSubmit,
  setValue,
  errors,
  isSubmitting,
  shippingMethod,
  paymentMethod,
  shippingCity,
  pickupBranchId,
  cart,
  orderSummary,
  currency,
  loadingCheckoutTotals,
  checkoutTotalsStale,
  deliveryCities,
  loadingDeliveryCities,
  pickupBranches,
  onSubmit,
}: CheckoutModalsProps) {
  return (
    <>
      <ShippingAddressModal
        isOpen={showShippingModal}
        onClose={() => setShowShippingModal(false)}
        register={register}
        handleSubmit={handleSubmit}
        setValue={setValue}
        errors={errors}
        isSubmitting={isSubmitting}
        shippingMethod={shippingMethod}
        paymentMethod={paymentMethod}
        cart={cart}
        orderSummary={orderSummary}
        currency={currency}
        shippingCity={shippingCity}
        pickupBranchId={pickupBranchId}
        loadingCheckoutTotals={loadingCheckoutTotals}
        checkoutTotalsStale={checkoutTotalsStale}
        deliveryCities={deliveryCities}
        loadingDeliveryCities={loadingDeliveryCities}
        pickupBranches={pickupBranches}
        onSubmit={onSubmit}
      />

    </>
  );
}
