import { z } from 'zod';
import { useTranslation } from '../../../lib/i18n-client';

const MAX_ORDER_NOTES_LENGTH = 2000;

export function useCheckoutSchema() {
  const { t } = useTranslation();

  return z.object({
    firstName: z.string().min(1, t('checkout.errors.firstNameRequired')),
    lastName: z.string().min(1, t('checkout.errors.lastNameRequired')),
    email: z.string().email(t('checkout.errors.invalidEmail')).min(1, t('checkout.errors.emailRequired')),
    phone: z.string().min(1, t('checkout.errors.phoneRequired')).regex(/^\+?[0-9]{8,15}$/, t('checkout.errors.invalidPhone')),
    notes: z
      .string()
      .max(MAX_ORDER_NOTES_LENGTH, t('checkout.errors.notesTooLong')),
    shippingMethod: z.enum(['pickup', 'courier'], {
      message: t('checkout.errors.selectShippingMethod'),
    }),
    paymentMethod: z.literal("cash"),
    shippingAddress: z.string().optional(),
    shippingCity: z.string().optional(),
  }).refine((data) => {
    if (data.shippingMethod === 'courier') {
      return data.shippingAddress && data.shippingAddress.trim().length > 0;
    }
    return true;
  }, {
    message: t('checkout.errors.addressRequired'),
    path: ['shippingAddress'],
  }).refine((data) => {
    if (data.shippingMethod === 'courier') {
      return data.shippingCity && data.shippingCity.trim().length > 0;
    }
    return true;
  }, {
    message: t('checkout.errors.cityRequired'),
    path: ['shippingCity'],
  });
}




