import { cookies } from 'next/headers';
import { HomeSpecialOffersSection } from '@/components/home/HomeSpecialOffersSection';
import type { SpecialOfferProduct } from '@/components/home/special-offer-product.types';
import { SPECIAL_OFFERS_PRODUCTS_LIMIT } from '@/constants/specialOffersSection';
import { getProductsListingCached } from '@/lib/cache/products-listing-redis';
import { dedupeCardProductsByTitle } from '@/lib/dedupeCardProductsByTitle';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';

/**
 * Special offers block: server-fetched promotion strip so first paint is not blocked on client IO.
 */
export async function HomeSpecialOffersBoundary() {
  const cookieStore = await cookies();
  const lang: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  let rows: SpecialOfferProduct[] = [];
  try {
    const result = await getProductsListingCached({
      page: 1,
      limit: SPECIAL_OFFERS_PRODUCTS_LIMIT,
      lang,
      filter: 'promotion',
      sort: 'createdAt',
      listingOmitProductAttributes: true,
      skipExactTotalCount: true,
    });
    rows = dedupeCardProductsByTitle(
      (result.data ?? []) as SpecialOfferProduct[],
    ).slice(0, SPECIAL_OFFERS_PRODUCTS_LIMIT);
  } catch {
    // Client `useQuery` can still load promotions if the server cache path fails.
  }

  return (
    <HomeSpecialOffersSection serverLanguage={lang} initialPromotionProducts={rows} />
  );
}
