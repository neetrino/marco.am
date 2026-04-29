import type { CheckoutPaymentMethodId } from '../../../lib/constants/checkout-payment-method';
import { useTranslation } from '../../../lib/i18n-client';
import { CHECKOUT_ARCA_CARD_LOGOS, CHECKOUT_IDRAM_LOGOS } from './checkout-payment-logos';

export type PaymentMethodId = CheckoutPaymentMethodId;

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
  logos: readonly string[];
}

export function usePaymentMethods(): PaymentMethod[] {
  const { t } = useTranslation();

  return [
    {
      id: 'cash',
      name: t('checkout.payment.cash'),
      description: t('checkout.payment.cashDescription'),
      logos: [],
    },
    {
      id: 'arca',
      name: t('checkout.payment.arca'),
      description: t('checkout.payment.arcaDescription'),
      logos: CHECKOUT_ARCA_CARD_LOGOS,
    },
    {
      id: 'idram',
      name: t('checkout.payment.idram'),
      description: t('checkout.payment.idramDescription'),
      logos: CHECKOUT_IDRAM_LOGOS,
    },
  ];
}
