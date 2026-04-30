import { cookies } from 'next/headers';
import { FeaturedProductsTabs } from '@/components/FeaturedProductsTabs';
import { FEATURED_PRODUCTS_VISIBLE_COUNT } from '@/components/featured-products-tabs.constants';
import type { SpecialOfferProduct } from '@/components/home/special-offer-product.types';
import { getProductsListingCached } from '@/lib/cache/products-listing-redis';
import { dedupeCardProductsByTitle } from '@/lib/dedupeCardProductsByTitle';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '@/lib/language';

/**
 * Streams after hero: first «Նորույթներ» strip is filled from Redis/DB on the server so the client
 * hydrates with real cards (no empty state or client waterfall on first paint).
 */
export async function HomeFeaturedSection() {
  const cookieStore = await cookies();
  const lang: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  const result = await getProductsListingCached({
    page: 1,
    limit: FEATURED_PRODUCTS_VISIBLE_COUNT,
    lang,
    filter: 'new',
    sort: 'createdAt',
    listingOmitProductAttributes: true,
  });

  const rows = dedupeCardProductsByTitle(
    (result.data ?? []) as SpecialOfferProduct[],
  ).slice(0, FEATURED_PRODUCTS_VISIBLE_COUNT);

  return <FeaturedProductsTabs serverLanguage={lang} initialNewProducts={rows} />;
}
