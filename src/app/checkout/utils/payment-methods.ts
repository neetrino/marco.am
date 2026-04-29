import type { CheckoutPaymentMethodId } from '../../../lib/constants/checkout-payment-method';
import { useTranslation } from '../../../lib/i18n-client';

export type PaymentMethodId = CheckoutPaymentMethodId;

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
  logo: string | null;
}

export function usePaymentMethods(): PaymentMethod[] {
  const { t } = useTranslation();

  return [
    {
      id: "arca",
      name: t("checkout.payment.arca"),
      description: t("checkout.payment.arcaDescription"),
      logo: null,
    },
    {
      id: "idram",
      name: t("checkout.payment.idram"),
      description: t("checkout.payment.idramDescription"),
      logo: null,
    },
    {
      id: "cash",
      name: t("checkout.payment.cash"),
      description: t("checkout.payment.cashDescription"),
      logo: null,
    },
  ];
}
