import type { CheckoutPaymentMethodId } from '../../../lib/constants/checkout-payment-method';
import { useTranslation } from '../../../lib/i18n-client';

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
  ];
}
