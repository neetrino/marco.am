import { SHOP_PLP_DEFAULT_PAGE_SIZE } from '@/lib/constants/shop-plp-pagination';
import type { LanguageCode } from '@/lib/language';

/**
 * Query params for storefront PLP listing APIs (server-aligned).
 */
export function buildShopListingApiParams(
  queryString: string,
  language: LanguageCode,
  options?: { skipExactTotalCount?: boolean },
): Record<string, string> {
  const params = new URLSearchParams(queryString);
  params.set('lang', language);
  params.set('listingOmitProductAttributes', '1');
  params.set('plpLeanListing', '1');
  params.set('listingImageLimit', '1');
  params.set('compact', '1');
  params.set('includeFilters', '0');
  if (options?.skipExactTotalCount !== false) {
    params.set('skipExactTotalCount', '1');
  }
  if (!params.has('limit')) {
    params.set('limit', String(SHOP_PLP_DEFAULT_PAGE_SIZE));
  }
  const out: Record<string, string> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}
