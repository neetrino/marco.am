import { revalidatePath, revalidateTag } from 'next/cache';

import { logger } from '@/lib/utils/logger';

/**
 * Forces the statically generated storefront home (`/`) to regenerate immediately.
 *
 * Call from admin route handlers after mutating data shown on the home page
 * (hero/promo banners, brand partners, product rails) so changes appear without
 * waiting for the ISR revalidate window. No-ops safely outside a request scope
 * (e.g. import scripts), where the ISR backstop handles freshness instead.
 */
export function revalidateStorefrontHome(): void {
  try {
    revalidatePath('/');
  } catch (error: unknown) {
    logger.warn('[revalidate] storefront home revalidation skipped', { error });
  }
}

/**
 * Forces the ISR-cached brands page (`/brands`) to regenerate immediately.
 * Call after admin changes brand partner list or brand partner settings.
 */
export function revalidateStorefrontBrands(): void {
  try {
    revalidateTag('brands-page', 'max');
    revalidatePath('/brands', 'page');
  } catch (error: unknown) {
    logger.warn('[revalidate] storefront brands revalidation skipped', { error });
  }
}
