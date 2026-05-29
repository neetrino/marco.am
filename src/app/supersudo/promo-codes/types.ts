import type { PromoCodeRecord } from '@/lib/schemas/promo-code.schema';

export type AdminPromoCode = PromoCodeRecord & {
  usageCount?: number;
};

export type PromoCodeFormState = PromoCodeRecord;
